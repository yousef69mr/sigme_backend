import express from "express";
import * as dotenv from "dotenv";
import cors from "cors";
import fileUpload from 'express-fileupload';
import userRouter from './api/users/users.controller.js'
import authRouter from './api/auth/auth.controller.js'
import devicesInfoRouter from './api/devices/devices.controller.js'
import locationRouter from './api/locations/locations.controller.js'
import mobileNetworkInfoRouter from './api/mobile-network/mobile-network.controller.js'
import connectivityRouter from './api/connectivity/connectivity.controller.js'

dotenv.config();

const app = express();

const PORT = process.env.PORT || 3000;

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
app.use('/api/mobile-network-info', mobileNetworkInfoRouter);

app.get("/", (req, res) => res.send("Express on Vercel"));

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});


// module.exports = app;

//app.listen(8080, () => console.log('Server has started on port 8080'))
