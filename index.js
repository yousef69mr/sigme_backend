import express from "express";
import * as dotenv from "dotenv";
import cors from "cors";
import fileUpload from 'express-fileupload';
import userRouter from './routes/users/users.controller.js'
import authRouter from './routes/auth/auth.controller.js'
import devicesInfoRouter from './routes/devices/devices.controller.js'
import locationRouter from './routes/locations/locations.controller.js'
import mobileNetworkInfoRouter from './routes/mobile-network/mobile-network.controller.js'
import connectivityRouter from './routes/connectivity/connectivity.controller.js'

import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

dotenv.config();

const app = express();

const PORT = process.env.PORT || 3000;

// Swagger options
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Your API Title',
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
  apis: ['./routes/users/users.controller.js'], // path to files with JSDoc comments
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// enable files upload
app.use(fileUpload({
  createParentPath: true
}));

app.use(express.static('uploads'));

app.use(cors());
app.use(express.json({ limit: "50mb" }));

// Swagger route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api/auth', authRouter)
app.use('/api/users', userRouter);
app.use('/api/devices', devicesInfoRouter);
app.use('/api/locations', locationRouter);
app.use('/api/connectivity', connectivityRouter);
app.use('/api/mobile-network-info', mobileNetworkInfoRouter);

app.get("/", (req, res) => res.send("Express on Vercel"));




app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});


// module.exports = app;

//app.listen(8080, () => console.log('Server has started on port 8080'))
