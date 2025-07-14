import { Request, Response } from 'express';
import { Farmer } from '../models/Farmer';

export const createFarmer = async (req: Request, res: Response) => {
  try {
    const farmer = new Farmer(req.body);
    await farmer.save();
    res.status(201).json(farmer);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const getAllFarmers = async (_req: Request, res: Response) => {
  const farmers = await Farmer.find();
  res.json(farmers);
};

export const getFarmerById = async (req: Request, res: Response) => {
  try {
    const farmer = await Farmer.findById(req.params.id);
    if (!farmer) return res.status(404).json({ message: 'Farmer not found' });
    res.json(farmer);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const updateFarmer = async (req: Request, res: Response) => {
  try {
    const farmer = await Farmer.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!farmer) return res.status(404).json({ message: 'Farmer not found' });
    res.json(farmer);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const deleteFarmer = async (req: Request, res: Response) => {
  try {
    const farmer = await Farmer.findByIdAndDelete(req.params.id);
    if (!farmer) return res.status(404).json({ message: 'Farmer not found' });
    res.json({ message: 'Farmer deleted successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
