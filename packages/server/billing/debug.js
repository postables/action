// import stripe from './stripe'
// import ms from 'ms';
// import MockDB from '../__tests__/setup/MockDB';
// import fieldsToSerialize from 'server/__tests__/utils/fieldsToSerialize';
// import fs from 'fs';
import StripeManager from '../utils/StripeManager'
import getRethink from '../database/rethinkDriver'

const manuallyStartSub = async (orgId) => {
  const r = getRethink()
  const manager = new StripeManager()
  const org = await r.table('Organization').get(orgId)
  const {stripeId} = org
  const quantity = 24
  const subscription = await manager.createSubscription(stripeId, orgId, quantity)
  console.log('sub', subscription.id)
}

manuallyStartSub('orgId').catch(console.log)

// stripe.subscriptions.update('sub_A9nq7dAOWGUKlD', {
//   trial_end: ~~((Date.now() + ms('5s')) / 1000)
// }, (err, res) => {
//   console.log('Sub result:', err, res);
// })

//   stripe.invoices.list({
//     customer
//   }, (err, invoices) => {
//     console.log('invoices result:', err, invoices);
//     const firstInvoiceId = invoices.data[0].id;
//     stripe.invoices.pay(firstInvoiceId, (err, invoice) => {
//       console.log('Payment result:', err, invoice)
//     })
//   })
// });

// stripe.invoices.retrieveLines('in_19pVJzFLaFINmHnBC5uwabBm', (err, invoice) => {
//   for (let i = 0; i < invoice.data.length; i++) {
//     const line = invoice.data[i];
// if (!line.period) {
// console.log(line);
// }
// }
// console.log('Payment result:', err, invoice.data)
// });

// stripe.invoices.retrieve('in_19vduHFLaFINmHnB77RHVwvE', (err, res) => {
//   console.log(err, res, res.lines.data);
// });

// stripe.invoices.retrieveUpcoming('cus_AGA08G2n4ueq5c', (err, res) => {
//   console.log(res, res.lines.data)
// })
