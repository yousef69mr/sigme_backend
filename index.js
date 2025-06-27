import express from "express";
import * as dotenv from "dotenv";
import cors from "cors";
import fileUpload from 'express-fileupload';
import userRouter from './controllers/users.controller.js'
import authRouter from './controllers/auth.controller.js'
import devicesInfoRouter from './controllers/devices.controller.js'
import locationRouter from './controllers/locations.controller.js'
import mobileNetworkInfoRouter from './controllers/mobile-network.controller.js'
import connectivityRouter from './controllers/connectivity.controller.js'
import contactRouter from './controllers/contacts.controller.js'
import alertModesRouter from './controllers/alert-mode.controller.js'
import alertsRouter from './controllers/alerts.controller.js'
import swaggerRoutes from './controllers/swagger.controller.js'

import { PORT } from './lib/constants/config.js'

dotenv.config();

const app = express();

// enable files upload
app.use(fileUpload({
  createParentPath: true
}));

app.use(express.static('uploads'));

app.use(cors());
app.use(express.json({ limit: "50mb" }));


app.use('/api/auth', authRouter)
app.use('/api/users', userRouter);
app.use('/api/devices', devicesInfoRouter);
app.use('/api/locations', locationRouter);
app.use('/api/connectivity', connectivityRouter);
app.use('/api/contacts', contactRouter);
app.use('/api/alert-modes', alertModesRouter)
app.use('/api/alerts', alertsRouter)
app.use('/api/mobile-network', mobileNetworkInfoRouter);
app.use(swaggerRoutes);

app.get("/", (req, res) => res.send("Express on Vercel"));



app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
