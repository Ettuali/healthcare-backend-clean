const PatientChartsModel = require('../models/patientChart.model');
// FIX: Import the entire service object, matching the reference code's structure
const cryptoService = require('../services/crypto.service'); 

exports.getVitalsChartData = async (req, res) => {
    try {
        const encryptedId = req.params.id;
        
        // ✨ FIX 1: Change 'chart_data' to 'authentication' to align with 
        // the working logic in the hospitalAdmin controller.
        const patientId = await cryptoService.decrypt(encryptedId, "authentication"); 
        
        const { vitalType, view } = req.query; 

        if (!patientId || !vitalType || !view) {
            // patientId will be null/undefined if decryption fails and returns an empty string, 
            // or if parameters are missing.
            return res.status(400).json({ success: false, message: 'Invalid or missing parameters.' });
        }

        const rawData = await PatientChartsModel.fetchVitalsHistory({ patientId, vitalType, view });

        const formattedData = rawData
            .filter(item => item.value !== null) 
            .map(item => {
                let value = item.value;
                
                // Extract only the Systolic (first number) for Blood Pressure charts
                if (vitalType === 'bloodPressure' && typeof value === 'string' && value.includes('/')) {
                    value = value.split('/')[0];
                }

                // Match the format expected by your frontend component
                return {
                    label: item.label,
                    value: parseFloat(value) || 0,
                };
            });

        res.json({ success: true, message: 'Vitals chart data fetched successfully', data: formattedData });
        
    } catch (error) {
        // Log the error for debugging
        console.error('Error fetching vitals chart data:', error.message);
        
        // ✨ FIX 2: Ensure that the decryption-related crash errors ('words') 
        // are explicitly caught and converted to a clean 400 response.
        if (error.message.includes('decryp') || error.message.includes('invalid') || error.message.includes('words')) {
            return res.status(400).json({ success: false, message: 'Invalid Patient ID provided.' });
        }
        
        // Fallback for all other server errors
        res.status(500).json({ success: false, message: 'Server error while fetching chart data.' });
    }
};