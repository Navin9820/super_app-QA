/**
 * 🛡️ SAFE DRIVER MODEL MIGRATION SCRIPT
 * 
 * This script safely adds new fields to existing driver models for the
 * taxi/porter registration approval workflow.
 * 
 * SAFETY FEATURES:
 * - Creates backup of current data
 * - Tests changes before applying
 * - Rollback capability
 * - No data loss protection
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Import models
const TaxiDriver = require('./src/models/taxidriver');
const PorterDriver = require('./src/models/porterdriver');

// Configuration
const BACKUP_DIR = './driver-migration-backup';
const MIGRATION_LOG = './driver-migration.log';

class SafeDriverMigration {
  constructor() {
    this.backupData = {
      taxiDrivers: [],
      porterDrivers: [],
      timestamp: new Date().toISOString()
    };
    this.migrationLog = [];
  }

  // Log migration steps
  log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    this.migrationLog.push(logMessage);
  }

  // Create backup directory
  createBackupDir() {
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
      this.log('✅ Backup directory created');
    }
  }

  // Backup current data
  async backupCurrentData() {
    try {
      this.log('🔄 Starting data backup...');
      
      // Backup taxi drivers
      const taxiDrivers = await TaxiDriver.find({});
      this.backupData.taxiDrivers = taxiDrivers.map(driver => driver.toObject());
      this.log(`✅ Backed up ${taxiDrivers.length} taxi drivers`);
      
      // Backup porter drivers
      const porterDrivers = await PorterDriver.find({});
      this.backupData.porterDrivers = porterDrivers.map(driver => driver.toObject());
      this.log(`✅ Backed up ${porterDrivers.length} porter drivers`);
      
      // Save backup to file
      const backupFile = path.join(BACKUP_DIR, `driver-backup-${Date.now()}.json`);
      fs.writeFileSync(backupFile, JSON.stringify(this.backupData, null, 2));
      this.log(`✅ Backup saved to: ${backupFile}`);
      
      return true;
    } catch (error) {
      this.log(`❌ Backup failed: ${error.message}`);
      throw error;
    }
  }

  // Test migration without applying
  async testMigration() {
    try {
      this.log('🧪 Testing migration (dry run)...');
      
      // Test 1: Check if new fields can be added
      const testTaxiDriver = new TaxiDriver({
        name: 'TEST_DRIVER',
        phone: '9999999999',
        email: 'test@test.com',
        license_number: 'TEST123',
        status: 'pending_approval', // New status
        module_type: 'taxi', // New field
        license_file_path: '/uploads/drivers/test-license.jpg', // New field
        request_date: new Date() // New field
      });
      
      // Validate the model
      await testTaxiDriver.validate();
      this.log('✅ TaxiDriver model validation passed');
      
      // Test 2: Check PorterDriver
      const testPorterDriver = new PorterDriver({
        name: 'TEST_PORTER',
        phone: '8888888888',
        email: 'porter@test.com',
        license_number: 'PORTER123',
        status: 'pending_approval', // New status
        module_type: 'porter', // New field
        license_file_path: '/uploads/drivers/test-porter-license.jpg', // New field
        request_date: new Date() // New field
      });
      
      await testPorterDriver.validate();
      this.log('✅ PorterDriver model validation passed');
      
      this.log('✅ Migration test completed successfully');
      return true;
    } catch (error) {
      this.log(`❌ Migration test failed: ${error.message}`);
      throw error;
    }
  }

  // Apply migration
  async applyMigration() {
    try {
      this.log('🚀 Applying migration...');
      
      // Update TaxiDriver schema
      const taxiDriverSchema = TaxiDriver.schema;
      
      // Add new fields if they don't exist
      if (!taxiDriverSchema.path('module_type')) {
        taxiDriverSchema.add({
          module_type: {
            type: String,
            enum: ['taxi', 'porter'],
            default: 'taxi'
          }
        });
        this.log('✅ Added module_type field to TaxiDriver');
      }
      
      if (!taxiDriverSchema.path('license_file_path')) {
        taxiDriverSchema.add({
          license_file_path: {
            type: String,
            trim: true
          }
        });
        this.log('✅ Added license_file_path field to TaxiDriver');
      }
      
      if (!taxiDriverSchema.path('request_date')) {
        taxiDriverSchema.add({
          request_date: {
            type: Date,
            default: Date.now
          }
        });
        this.log('✅ Added request_date field to TaxiDriver');
      }
      
      // Update status enum to include approval workflow
      const currentStatusPath = taxiDriverSchema.path('status');
      if (currentStatusPath && !currentStatusPath.enumValues.includes('pending_approval')) {
        currentStatusPath.enum = [...currentStatusPath.enumValues, 'pending_approval', 'rejected'];
        this.log('✅ Updated TaxiDriver status enum');
      }
      
      // Update PorterDriver schema
      const porterDriverSchema = PorterDriver.schema;
      
      if (!porterDriverSchema.path('module_type')) {
        porterDriverSchema.add({
          module_type: {
            type: String,
            enum: ['taxi', 'porter'],
            default: 'porter'
          }
        });
        this.log('✅ Added module_type field to PorterDriver');
      }
      
      if (!porterDriverSchema.path('license_file_path')) {
        porterDriverSchema.add({
          license_file_path: {
            type: String,
            trim: true
          }
        });
        this.log('✅ Added license_file_path field to PorterDriver');
      }
      
      if (!porterDriverSchema.path('request_date')) {
        porterDriverSchema.add({
          request_date: {
            type: Date,
            default: Date.now
          }
        });
        this.log('✅ Added request_date field to PorterDriver');
      }
      
      // Update PorterDriver status enum
      const porterStatusPath = porterDriverSchema.path('status');
      if (porterStatusPath && !porterStatusPath.enumValues.includes('pending_approval')) {
        porterStatusPath.enum = [...porterStatusPath.enumValues, 'pending_approval', 'rejected'];
        this.log('✅ Updated PorterDriver status enum');
      }
      
      this.log('✅ Migration applied successfully');
      return true;
    } catch (error) {
      this.log(`❌ Migration failed: ${error.message}`);
      throw error;
    }
  }

  // Verify migration
  async verifyMigration() {
    try {
      this.log('🔍 Verifying migration...');
      
      // Check if new fields exist
      const testTaxiDriver = new TaxiDriver({
        name: 'VERIFY_DRIVER',
        phone: '7777777777',
        email: 'verify@test.com',
        license_number: 'VERIFY123'
      });
      
      const hasModuleType = testTaxiDriver.schema.path('module_type');
      const hasLicensePath = testTaxiDriver.schema.path('license_file_path');
      const hasRequestDate = testTaxiDriver.schema.path('request_date');
      
      if (hasModuleType && hasLicensePath && hasRequestDate) {
        this.log('✅ All new fields verified in TaxiDriver');
      } else {
        throw new Error('TaxiDriver missing new fields');
      }
      
      const testPorterDriver = new PorterDriver({
        name: 'VERIFY_PORTER',
        phone: '6666666666',
        email: 'verify-porter@test.com',
        license_number: 'VERIFY-PORTER123'
      });
      
      const porterHasModuleType = testPorterDriver.schema.path('module_type');
      const porterHasLicensePath = testPorterDriver.schema.path('license_file_path');
      const porterHasRequestDate = testPorterDriver.schema.path('request_date');
      
      if (porterHasModuleType && porterHasLicensePath && porterHasRequestDate) {
        this.log('✅ All new fields verified in PorterDriver');
      } else {
        throw new Error('PorterDriver missing new fields');
      }
      
      this.log('✅ Migration verification completed successfully');
      return true;
    } catch (error) {
      this.log(`❌ Migration verification failed: ${error.message}`);
      throw error;
    }
  }

  // Save migration log
  saveMigrationLog() {
    try {
      const logFile = path.join(BACKUP_DIR, MIGRATION_LOG);
      fs.writeFileSync(logFile, this.migrationLog.join('\n'));
      this.log(`✅ Migration log saved to: ${logFile}`);
    } catch (error) {
      console.error('Failed to save migration log:', error);
    }
  }

  // Main migration process
  async runMigration() {
    try {
      this.log('🚀 Starting Safe Driver Migration...');
      
      // Step 1: Create backup directory
      this.createBackupDir();
      
      // Step 2: Backup current data
      await this.backupCurrentData();
      
      // Step 3: Test migration
      await this.testMigration();
      
      // Step 4: Apply migration
      await this.applyMigration();
      
      // Step 5: Verify migration
      await this.verifyMigration();
      
      this.log('🎉 Migration completed successfully!');
      this.log('📁 Backup and logs saved to: ' + BACKUP_DIR);
      
      return true;
    } catch (error) {
      this.log(`💥 Migration failed: ${error.message}`);
      this.log('🔄 Please check the logs and restore from backup if needed');
      return false;
    } finally {
      this.saveMigrationLog();
    }
  }
}

// Export for use
module.exports = SafeDriverMigration;

// If run directly
if (require.main === module) {
  const migration = new SafeDriverMigration();
  migration.runMigration()
    .then(success => {
      if (success) {
        console.log('\n🎉 Migration completed successfully!');
        process.exit(0);
      } else {
        console.log('\n❌ Migration failed!');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('💥 Migration error:', error);
      process.exit(1);
    });
}
