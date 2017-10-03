import {GraphQLBoolean, GraphQLID, GraphQLNonNull} from 'graphql';
import fetchAllLines from 'server/billing/helpers/fetchAllLines';
import terminateSubscription from 'server/billing/helpers/terminateSubscription';
import stripe from 'server/billing/stripe';
import getRethink from 'server/database/rethinkDriver';
import getPubSub from 'server/utils/getPubSub';
import {errorObj} from 'server/utils/utils';
import shortid from 'shortid';
import {BILLING_LEADER, FAILED, NOTIFICATIONS_ADDED, PAYMENT_REJECTED} from 'universal/utils/constants';

export default {
  name: 'StripeFailPayment',
  description: 'When stripe tells us an invoice payment failed, update it in our DB',
  type: GraphQLBoolean,
  args: {
    invoiceId: {
      type: new GraphQLNonNull(GraphQLID),
      description: 'The stripe invoice ID'
    }
  },
  resolve: async (source, {invoiceId}, {serverSecret}) => {
    // AUTH
    if (serverSecret !== process.env.AUTH0_CLIENT_SECRET) {
      throw new Error('Don’t be rude.');
    }

    const r = getRethink();
    const now = new Date();

    // VALIDATION
    const {amount_due: amountDue, customer: customerId, metadata, subscription, paid} = await stripe.invoices.retrieve(invoiceId);
    let orgId = metadata.orgId;
    if (!orgId) {
      ({metadata: {orgId}} = await stripe.customers.retrieve(customerId));
      if (!orgId) {
        throw errorObj({_error: `Could not find orgId on invoice ${invoiceId}`});
      }
    }
    const org = await r.table('Organization').get(orgId).pluck('creditCard', 'stripeSubscriptionId');
    const {creditCard, stripeSubscriptionId} = org;
    /* attack vector #1: call the webhook with the victims invoiceId that was successful
     attack vector #2: call the webhook with the victims old failed invoiceId, causing them to fail again
     once failed, the stripeSubscriptionId will change (id1 -> null -> id2 on success)
     this is better than making sure the webhook was sent just a couple hours ago
     also better than looking up the charge & making sure that there hasn't been a more recent, successful charge */
    if (paid || stripeSubscriptionId !== subscription) return;

    // RESOLUTION
    // this must have not been a trial (or it was and they entered a card that got invalidated <1 hr after entering it)
    if (creditCard.last4) {
      const stripeLineItems = await fetchAllLines(invoiceId);
      const nextMonthCharges = stripeLineItems.find((line) => line.description === null && line.proration === false);
      const nextMonthAmount = nextMonthCharges && nextMonthCharges.amount || 0;

      const orgDoc = await terminateSubscription(orgId);
      const userIds = orgDoc.orgUsers.reduce((billingLeaders, orgUser) => {
        if (orgUser.role === BILLING_LEADER) {
          billingLeaders.push(orgUser.id);
        }
        return billingLeaders;
      }, []);
      const {last4, brand} = creditCard;
      await stripe.customers.update(customerId, {
        // amount_due includes the old account_balance, so we can (kinda) atomically set this
        // we take out the charge for future services since we are ending service immediately
        account_balance: amountDue - nextMonthAmount
      });
      const notification = {
        id: shortid.generate(),
        type: PAYMENT_REJECTED,
        startAt: now,
        orgId,
        userIds,
        last4,
        brand
      };
      await r({
        update: r.table('Invoice').get(invoiceId).update({status: FAILED}),
        insert: r.table('Notification').insert(notification)
      });
      const notificationsAdded = {notifications: [notification]};

      userIds.forEach((userId) => {
        getPubSub().publish(`${NOTIFICATIONS_ADDED}.${userId}`, {notificationsAdded});
      });
    }
  }
};
