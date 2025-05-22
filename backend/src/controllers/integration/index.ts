import axios from "axios";
import { Request, Response } from "express";
import integration from "../../model/integration";
import { AuthRequest } from "../../types";

export const connectWooCommerce = async (req: AuthRequest, res: Response) => {
  const { key, secret, storeUrl } = req.body;
  // Cast request to our authenticated request type
  const authenticatedReq = req;

  try {
    // Try connecting to WooCommerce API with provided credentials
    const response = await axios.get(
      `${storeUrl}/wp-json/wc/v3/customers?consumer_key=${key}&consumer_secret=${secret}`
    );

    console.log(response,"response")

    // Only save integration if WooCommerce connection is successful
    const addintegration = await integration.create({
      key: key,
      secret: secret,
      storeUrl: storeUrl,
      userId: authenticatedReq.user?._id ?? null, // Use id from JWT payload
      integration: "WooCommerce",
    });

    res.status(200).json({
      message: "Connected to WooCommerce successfully",
      data: response.data,
      integration: addintegration,
    });
  } 
  catch (error: any) {
    console.error(
      "Error connecting to WooCommerce:",
      error?.response?.data || error.message,
      error
    );
    res.status(400).json({
      message: "Failed to connect to WooCommerce",
      error: error?.response?.data || error.message,
    });
  }
};
