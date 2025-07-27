require('dotenv').config();
const { connectDB, databaseService } = require('../src/config/db');

async function testFirebaseConnection() {
    console.log('🔥 Testing Firebase Connection...\n');

    try {
        // Test database connection
        console.log('1. Connecting to database...');
        await connectDB();

        // Get database instance
        const db = databaseService.getDb();
        console.log('✅ Database connected successfully');
        console.log(`📊 Database type: ${databaseService.getDatabaseType()}`);

        // Test Firestore operations
        console.log('\n2. Testing Firestore operations...');

        // Test create document
        console.log('   - Creating test document...');
        const testData = {
            name: 'Test Firebase Connection',
            timestamp: new Date(),
            status: 'testing'
        };

        const docRef = await db.collection('test').add(testData);
        console.log(`   ✅ Document created with ID: ${docRef.id}`);

        // Test read document
        console.log('   - Reading test document...');
        const doc = await docRef.get();
        if (doc.exists) {
            console.log('   ✅ Document read successfully');
            console.log('   📄 Document data:', doc.data());
        }

        // Test update document
        console.log('   - Updating test document...');
        await docRef.update({
            status: 'updated',
            updatedAt: new Date()
        });
        console.log('   ✅ Document updated successfully');

        // Test query collection
        console.log('   - Querying test collection...');
        const snapshot = await db.collection('test').where('status', '==', 'updated').get();
        console.log(`   ✅ Found ${snapshot.size} documents`);

        // Clean up - delete test document
        console.log('   - Cleaning up test document...');
        await docRef.delete();
        console.log('   ✅ Test document deleted');

        console.log('\n🎉 All Firebase tests passed successfully!');
        console.log('🚀 Your Firebase setup is working correctly.');

    } catch (error) {
        console.error('\n❌ Firebase test failed:');
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);
    }

    process.exit(0);
}

// Run the test
testFirebaseConnection();
