import {PROXY_TARGET} from "./proxy.const.mjs";
import {customizationConfigOverride} from "./customization_config_override.mjs";
import {deepMerge, decompressBuffer, transformAlmaRequestResponse} from "./proxy-utils.mjs";






const proxyRules = [
  {
    context: [
      '/custom/*/assets',
      '/custom/*/assets/**',
      '/nde/custom/*/assets',
      '/nde/custom/*/assets/**'
    ],
    target: 'not-needed',
    router: (req) => `${req.protocol}://${req.get('host')}`,
    changeOrigin: false,
    logLevel: 'debug',
    pathRewrite: (path) =>
      path.replace(/^\/(?:nde\/)?custom\/[^/]+\/assets\/?/, '/assets/'),
  },
  {
    context: ['/primaws/rest/pub/configuration/vid/'],
    target: PROXY_TARGET,
    secure: true,
    changeOrigin: true,
    logLevel: 'debug',
    selfHandleResponse: true,
    onProxyRes(proxyRes, req, res) {
      const chunks = [];
      proxyRes.on('data', chunk => chunks.push(chunk));
      proxyRes.on('end', () => {
        try {
          const bodyStr = Buffer.concat(chunks).toString('utf8');
          const json = JSON.parse(bodyStr);
          // MERGE instead of replace to retain unspecified fields
          json.customization = deepMerge(json.customization || {}, customizationConfigOverride);
          const out = JSON.stringify(json);
          res.setHeader('content-type', 'application/json');
          res.end(out);
        } catch (e) {
          res.end(Buffer.concat(chunks));
        }
      });
    }
  },
  {
    context: [
      '/nde/custom/**'
    ],
    target: 'not-needed',
    router: (req) => {
      const url = `${req.protocol}://${req.get('host')}`
      console.log(url);
      return url;

    },
    secure: true,
    logLevel: 'debug',
    pathRewrite: { '^/nde/custom/.*/': '' },

  },
  {
    context: ['/primaws/rest/priv/ILSServices/titleServices/**/AlmaRequest'],
    target: PROXY_TARGET,
    secure: true,
    changeOrigin: true,
    logLevel: 'debug',
    selfHandleResponse: true,
    onProxyRes(proxyRes, req, res) {
      console.log('\n[AlmaRequest Proxy] Intercepting:', req.url);
      const chunks = [];
      proxyRes.on('data', chunk => chunks.push(chunk));
      proxyRes.on('end', async () => {
        // Copy original headers except content-encoding and content-length
        Object.keys(proxyRes.headers).forEach(key => {
          if (key.toLowerCase() !== 'content-encoding' && key.toLowerCase() !== 'content-length') {
            res.setHeader(key, proxyRes.headers[key]);
          }
        });
        res.statusCode = proxyRes.statusCode;

        try {
          const buffer = Buffer.concat(chunks);
          const encoding = proxyRes.headers['content-encoding'];
          console.log('[AlmaRequest Proxy] Response encoding:', encoding || 'none');
          const bodyStr = await decompressBuffer(buffer, encoding);
          const json = transformAlmaRequestResponse(JSON.parse(bodyStr));

          res.setHeader('content-type', 'application/json');
          res.end(JSON.stringify(json));
          console.log('[AlmaRequest Proxy] Response sent successfully\n');
        } catch (e) {
          console.error('[AlmaRequest Proxy] Error:', e);
          res.end(Buffer.concat(chunks));
        }
      });
    }
  },
  {
    context: [
      '**', '!/nde/custom/**'
    ],
    target: PROXY_TARGET,
    secure: true,
    changeOrigin: true,
    logLevel: 'debug',

  }
];



export default proxyRules;
