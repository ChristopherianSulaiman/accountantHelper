const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Service = sequelize.define('Service', {
    service_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    service_type: {
        type: DataTypes.ENUM('internet', 'connectivity', 'hosting', 'cloud', 'security', 'maintenance'),
        allowNull: false
    },
    service_name: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    nrc: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    mrc: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    start_date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    end_date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    }
}, {
    tableName: 'services',
    timestamps: false
});

module.exports = Service; 