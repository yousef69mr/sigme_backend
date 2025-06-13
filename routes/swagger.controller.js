// routes/docs.js

import express from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
// import { serveStatic } from 'serve-static';
import swaggerUiDist from 'swagger-ui-dist';
import { PORT } from '../lib/constants/config.js'

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

const swaggerSpec = swaggerJsdoc({
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Sigme Api Collection',
            version: '1.0.0',
            description: 'Your API description',
        },
        servers: [
            {
                url: 'http://localhost:'.concat(PORT), // your local dev server
            },
            {
                url: 'https://sigme-backend.vercel.app'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [{ bearerAuth: [] }],
    },
    apis: [
        path.resolve(__dirname, '../routes/users/users.controller.js')
    ], // path to files with JSDoc comments
});

const swaggerUiPath = swaggerUiDist.getAbsoluteFSPath();

router.use('/api-docs', express.static(swaggerUiPath, { index: false }));

router.get('/api-docs', (req, res) => {
    res.send(`
    <!DOCTYPE html><html><head>
      <title>API Docs</title>
      <link rel="stylesheet" href="/api-docs/swagger-ui.css" />
    </head><body>
      <div id="swagger-ui"></div>
      <script src="/api-docs/swagger-ui-bundle.js"></script>
      <script src="/api-docs/swagger-ui-standalone-preset.js"></script>
      <script>
        window.onload = () => {
          SwaggerUIBundle({
            url: '/swagger.json',
            dom_id: '#swagger-ui',
            presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
            layout: "StandaloneLayout",
          });
        };
      </script>
    </body></html>
  `);
});



router.get('/swagger.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
});

export default router;
