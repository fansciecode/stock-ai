#!/usr/bin/env node

// Simple script to test API connectivity and CORS
const axios = require('axios');

const API_URL = 'https://api.ibcm.app/api';

async function testAPI() {
    console.log('🔍 Testing API Connection...');
    console.log('API URL:', API_URL);
    
    try {
        // Test basic connectivity
        console.log('\n1. Testing basic connectivity...');
        const response = await axios.get(`${API_URL}/health`, {
            timeout: 5000,
            headers: {
                'Origin': 'http://localhost:5000'
            }
        });
        console.log('✅ Basic connectivity: OK');
        console.log('Response:', response.data);
    } catch (error) {
        console.log('❌ Basic connectivity failed:', error.message);
    }
    
    try {
        // Test CORS preflight
        console.log('\n2. Testing CORS preflight (OPTIONS)...');
        const response = await axios.options(`${API_URL}/auth/register`, {
            headers: {
                'Origin': 'http://localhost:5000',
                'Access-Control-Request-Method': 'POST',
                'Access-Control-Request-Headers': 'Content-Type'
            }
        });
        console.log('✅ CORS preflight: OK');
        console.log('Access-Control-Allow-Origin:', response.headers['access-control-allow-origin']);
        console.log('Access-Control-Allow-Methods:', response.headers['access-control-allow-methods']);
    } catch (error) {
        console.log('❌ CORS preflight failed:', error.message);
        if (error.response) {
            console.log('Response status:', error.response.status);
            console.log('Response headers:', error.response.headers);
        }
    }
    
    try {
        // Test actual signup endpoint
        console.log('\n3. Testing signup endpoint...');
        const response = await axios.post(`${API_URL}/auth/register`, {
            name: 'Test User',
            email: 'test@example.com',
            password: 'testpassword'
        }, {
            headers: {
                'Origin': 'http://localhost:5000',
                'Content-Type': 'application/json'
            }
        });
        console.log('✅ Signup endpoint: OK');
    } catch (error) {
        console.log('❌ Signup endpoint failed:', error.message);
        if (error.response) {
            console.log('Response status:', error.response.status);
            console.log('Response data:', error.response.data);
        }
    }
}

testAPI();