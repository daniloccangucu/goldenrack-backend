import { Request, Response } from "express";

import recordsServices from "../services/recordsService";
import {
  parseRecordsQueryParams,
  validateRecordBody,
} from "../utils/recordsUtils";
import { validateStockItemBody } from "../utils/stockItemsUtils";

export async function getAllRecordsHandler(req: Request, res: Response) {
  try {
    const { limit, page, artist, title, genres, min, max, sortPrice } =
      parseRecordsQueryParams(req);

    const records = await recordsServices.getAllRecords({
      search: { artist, title },
      genres,
      price: { min, max },
      pagination: { limit, page },
      sortPrice,
    });

    res.status(200).json({
      data: records,
      message: "Records retrieved successfully",
      status: "success",
    });
  } catch (error) {
    if (error) {
      console.error("Error while fetching cars:", error);
      res.status(500).json({
        message: "Internal server error",
        status: "error",
      });
    }
  }
}

// TODO handle errors with boom and refactoring getRecordByIdHandler
export async function getRecordByIdHandler(req: Request, res: Response) {
  try {
    const id = req.params.id;

    const foundRecord = await recordsServices.getRecordById({ id });

    res.send(foundRecord);
  } catch (error) {
    console.error(error);
  }
}

export async function getGenresHandler(_req: Request, res: Response) {
  // todo error handling for getGenresHandler
  const genres = await recordsServices.getGenres();
  res.send(genres);
}

export async function createRecordWithStockHandler(
  req: Request,
  res: Response
) {
  try {
    const { condition, price, store } = req.body;
    const stockItem = { condition, price, store };
    validateRecordBody(req);
    validateStockItemBody(stockItem);

    const newRecord = await recordsServices.createRecordWithStockItem(req.body);

    res.status(201).json({
      data: newRecord,
      message: "Record created successfully",
      status: "success",
    });
  } catch (error) {
    console.error("Error creating record:", error);
    res.status(500).json({
      message: "Internal server error",
      status: "error",
    });
  }
}