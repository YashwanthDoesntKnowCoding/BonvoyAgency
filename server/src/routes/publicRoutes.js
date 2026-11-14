const express = require('express');
const { listDestinations, showDestination, listPackages, showPackage, featuredPackages, listHotels, filters } = require('../controllers/publicController');

const router = express.Router();

router.get('/destinations', listDestinations);
router.get('/destinations/:id', showDestination);
router.get('/packages', listPackages);
router.get('/packages/featured', featuredPackages);
router.get('/packages/:slug', showPackage);
router.get('/hotels', listHotels);
router.get('/meta/filters', filters);

module.exports = router;
