const { z } = require('zod');
const { getAllDestinations, getDestinationById, getPackages, getPackageBySlug, getFeaturedPackages, getHotels, getFiltersMeta } = require('../services/catalogService');
const { successResponse } = require('../utils/response');

const listPackagesSchema = z.object({
  q: z.string().optional(),
  destination: z.string().optional(),
  category: z.string().optional(),
  minPrice: z.string().optional(),
  maxPrice: z.string().optional(),
  sort: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

async function listDestinations(req, res) {
  res.json(successResponse(await getAllDestinations(), 'Destinations fetched'));
}

async function showDestination(req, res) {
  const destination = await getDestinationById(req.params.id);
  res.json(successResponse(destination, destination ? 'Destination fetched' : 'Destination not found'));
}

async function listPackages(req, res) {
  const query = listPackagesSchema.parse(req.query);
  const page = Number(query.page || 1);
  const limit = Number(query.limit || 20);
  const allPackages = await getPackages(query);
  const paginated = allPackages.slice((page - 1) * limit, page * limit);
  res.json(successResponse({ items: paginated, page, limit, total: allPackages.length }, 'Packages fetched'));
}

async function showPackage(req, res) {
  const pkg = await getPackageBySlug(req.params.slug);
  if (!pkg) return res.status(404).json({ success: false, error: { code: 'PACKAGE_NOT_FOUND', message: 'Package not found' } });
  return res.json(successResponse(pkg, 'Package fetched'));
}

async function featuredPackages(req, res) {
  res.json(successResponse(await getFeaturedPackages(), 'Featured packages fetched'));
}

async function listHotels(req, res) {
  res.json(successResponse(await getHotels(), 'Hotels fetched'));
}

async function filters(req, res) {
  res.json(successResponse(await getFiltersMeta(), 'Filters fetched'));
}

module.exports = { listDestinations, showDestination, listPackages, showPackage, featuredPackages, listHotels, filters };
