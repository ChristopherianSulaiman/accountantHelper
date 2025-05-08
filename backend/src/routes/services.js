const express = require('express');
const router = express.Router();
const Service = require('../models/Service');

// Get all services
router.get('/', async (req, res) => {
    try {
        const services = await Service.findAll();
        res.json(services);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create a new service
router.post('/', async (req, res) => {
    try {
        const service = await Service.create(req.body);
        res.status(201).json(service);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Get a specific service
router.get('/:id', async (req, res) => {
    try {
        const service = await Service.findByPk(req.params.id);
        if (service) {
            res.json(service);
        } else {
            res.status(404).json({ message: 'Service not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update a service
router.put('/:id', async (req, res) => {
    try {
        const service = await Service.findByPk(req.params.id);
        if (service) {
            await service.update(req.body);
            res.json(service);
        } else {
            res.status(404).json({ message: 'Service not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete a service
router.delete('/:id', async (req, res) => {
    try {
        const service = await Service.findByPk(req.params.id);
        if (service) {
            await service.destroy();
            res.json({ message: 'Service deleted' });
        } else {
            res.status(404).json({ message: 'Service not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router; 