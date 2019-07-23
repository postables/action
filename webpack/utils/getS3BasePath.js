import url from 'url'
import getWebpackBuildPath from '../../packages/server/utils/getWebpackPublicPath'

export function getS3BasePath () {
  let publicPath = getWebpackBuildPath()
  if (publicPath.startsWith('//')) {
    // protocol-relative url? normalize it:
    publicPath = `http:${publicPath}`
  }
  // parse URL:
  const parsedUrl = url.parse(publicPath)
  if (!parsedUrl.protocol) {
    throw new Error(`invalid webpack public path ${publicPath}`)
  }

  return parsedUrl.path.substring(1) // removes leading '/'
}
