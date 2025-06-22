// routes/docs.js

import express from 'express';
import swaggerJsdoc from 'swagger-jsdoc';

import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

import { PORT } from '../lib/constants/config.js'

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

const isProduction = process.env.NODE_ENV === 'production';

const swaggerSpec = swaggerJsdoc({
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Sigme Api Collection',
            version: '1.0.0',
            description: 'Your API description',
        },
        servers: isProduction
            ? [
                {
                    url: 'https://sigme-backend.vercel.app',
                },
            ]
            : [
                {
                    url: `http://localhost:${PORT}`,
                },
                {
                    url: 'https://sigme-backend.vercel.app',
                },
            ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
            schemas: {
                DeviceInfo: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', example: "uuid-or-mongo-id" },
                        platform: { type: 'string' },
                        model: { type: 'string' },
                        brand: { type: 'string' },
                        manufacturer: { type: 'string' },
                        systemName: { type: 'string' },
                        systemVersion: { type: 'string' },
                        sdkInt: { type: 'integer' },
                        isPhysicalDevice: { type: 'boolean' },
                        deviceId: { type: 'string' },
                        userAgent: { type: 'string' },
                        hardwareConcurrency: { type: 'integer' },
                        deviceMemory: { type: 'number' },
                        userId: { type: 'string' },
                    },
                    required: ['id', 'platform']
                },
                ConnectivityLog: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        connectivityType: { type: 'string', example: 'wifi' },
                        isConnected: { type: 'boolean' },
                        ipAddress: { type: 'string', nullable: true },
                        wifiName: { type: 'string', nullable: true },
                        wifiBSSID: { type: 'string', nullable: true },
                        timestamp: { type: 'string', format: 'date-time' },
                        location: {
                            type: 'object',
                            nullable: true,
                            properties: {
                                id: { type: 'string' },
                                latitude: { type: 'number' },
                                longitude: { type: 'number' },
                                accuracy: { type: 'number' },
                            },
                        },
                        mobileNetworkInfo: {
                            type: 'object',
                            nullable: true,
                            properties: {
                                id: { type: 'string' },
                                carrier: { type: 'string' },
                                networkType: { type: 'string' },
                                signalLevel: { type: 'integer' },
                                signalDbm: { type: 'integer' },
                                mcc: { type: 'string' },
                                mnc: { type: 'string' },
                            },
                        },

                    }
                },
                Contact: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            example: 'clwx7fxvq0001kwn4t3d2drcg'
                        },
                        phone: {
                            type: 'string',
                            example: '+201234567890'
                        },
                        email: {
                            type: 'string',
                            example: 'contact@example.com'
                        },
                        contactName: {
                            type: 'string',
                            example: 'Ahmed Ali'
                        },
                        type: {
                            type: 'string',
                            enum: ['EMERGENCY', 'FAVORITE'],
                            example: 'EMERGENCY'
                        },
                        userId: {
                            type: 'string',
                            example: 'clwx7fxk80000kwn4lw5b9fdr'
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time',
                            example: '2025-06-19T20:00:00.000Z'
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time',
                            example: '2025-06-19T20:05:00.000Z'
                        }
                    },
                    required: ['id', 'phone', 'email', 'type', 'userId']
                },
                AlertMode: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            example: '60c72b2f9eb1f0a5c8d6f99d'
                        },
                        key: {
                            type: 'string',
                            example: 'silent_mode'
                        },
                        label: {
                            type: 'string',
                            example: 'Silent Mode'
                        },
                        description: {
                            type: 'string',
                            example: 'No sound or vibration will be triggered'
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time',
                            example: '2025-06-21T18:20:30Z'
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time',
                            example: '2025-06-20T14:15:10Z'
                        }
                    },
                    required: ['id', 'key', 'label']
                },
                User: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            example: '60d0fe4f5311236168a109ca'
                        },
                        name: {
                            type: 'string',
                            example: 'Yousef Ali'
                        },
                        email: {
                            type: 'string',
                            example: 'yousef@example.com'
                        },
                        phone: {
                            type: 'string',
                            example: '+201234567890'
                        },
                        gender: {
                            type: 'string',
                            example: 'male'
                        },
                        avatar: {
                            type: 'string',
                            example: '/users/60d0fe4f5311236168a109ca/avatar.png'
                        },
                        role: {
                            type: 'string',
                            enum: ['USER', 'ADMIN'],
                            example: 'USER'
                        },
                        alertModeId: {
                            type: 'string',
                            example: '60c72b2f9eb1f0a5c8d6f99d'
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time',
                            example: '2025-06-20T14:15:10Z'
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time',
                            example: '2025-06-21T18:20:30Z'
                        }
                    },
                    required: ['id', 'name', 'email', 'phone', 'role']
                }
            },
        },
        security: [{ bearerAuth: [] }],
    },
    apis: [
        path.resolve(__dirname, '../controllers/auth.controller.js'),
        path.resolve(__dirname, '../controllers/users.controller.js'),
        path.resolve(__dirname, '../controllers/devices.controller.js'),
        path.resolve(__dirname, '../controllers/connectivity.controller.js'),
        path.resolve(__dirname, '../controllers/contacts.controller.js'),
        path.resolve(__dirname, '../controllers/alert-mode.controller.js'),
    ], // path to files with JSDoc comments
});

router.get('/api-docs', (req, res) => {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>API Docs</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist/swagger-ui.css" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      SwaggerUIBundle({
        url: '/swagger.json',
        dom_id: '#swagger-ui',
        presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
        layout: 'StandaloneLayout'
      });
    };
  </script>
</body>
</html>
`;

    res.send(html);
});




router.get('/swagger.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
});

export default router;
