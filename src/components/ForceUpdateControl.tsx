import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Stack,
  Divider,
} from '@mui/material';
import { appConfigService } from '@/services/appConfigService';

export default function ForceUpdateControl() {
  const [minVersion, setMinVersion] = useState('1.0.0');
  const [androidUrl, setAndroidUrl] = useState('');
  const [iosUrl, setIosUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoadingConfig(true);
      const config = await appConfigService.getConfig();
      setMinVersion(config.min_app_version || '1.0.0');
      setAndroidUrl(config.force_update_url_android || '');
      setIosUrl(config.force_update_url_ios || '');
    } catch (err: any) {
      console.error('Failed to load config:', err);
      setError('Failed to load configuration');
    } finally {
      setLoadingConfig(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    // Validate version format
    const versionRegex = /^\d+\.\d+\.\d+$/;
    if (!versionRegex.test(minVersion)) {
      setError('Invalid version format. Use format: X.Y.Z (e.g., 1.2.0)');
      setLoading(false);
      return;
    }

    try {
      await appConfigService.updateConfig({
        min_app_version: minVersion,
        force_update_url_android: androidUrl,
        force_update_url_ios: iosUrl,
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('Failed to update config:', err);
      setError(err.message || 'Failed to update configuration');
    } finally {
      setLoading(false);
    }
  };

  if (loadingConfig) {
    return (
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="center" alignItems="center" py={4}>
          <CircularProgress />
        </Box>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Force Update Configuration
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Set the minimum app version required. Users with older versions will be forced to update.
      </Typography>

      <Stack spacing={3}>
        <TextField
          label="Minimum App Version"
          value={minVersion}
          onChange={(e) => setMinVersion(e.target.value)}
          placeholder="1.2.0"
          helperText="Format: X.Y.Z (e.g., 1.2.0). Users below this version will be forced to update."
          fullWidth
          disabled={loading}
        />

        <Divider />

        <Typography variant="subtitle2" color="text.secondary">
          Update URLs (Store Links)
        </Typography>

        <TextField
          label="Android Play Store URL"
          value={androidUrl}
          onChange={(e) => setAndroidUrl(e.target.value)}
          placeholder="https://play.google.com/store/apps/details?id=com.scrapiz.app"
          helperText="Google Play Store link for Android users"
          fullWidth
          disabled={loading}
        />

        <TextField
          label="iOS App Store URL"
          value={iosUrl}
          onChange={(e) => setIosUrl(e.target.value)}
          placeholder="https://apps.apple.com/app/scrapiz/id123456789"
          helperText="Apple App Store link for iOS users"
          fullWidth
          disabled={loading}
        />

        <Box>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSave}
            disabled={loading}
            sx={{ minWidth: 120 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Save Changes'}
          </Button>
        </Box>

        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success">
            Configuration updated successfully! Users with app version below {minVersion} will now be prompted to update.
          </Alert>
        )}

        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2" fontWeight="bold" gutterBottom>
            How it works:
          </Typography>
          <Typography variant="body2" component="div">
            • When users open the app, their version is checked against the minimum version
            <br />
            • If their version is lower, they see a full-screen update modal
            <br />
            • The modal cannot be dismissed - they must update to continue
            <br />
            • Changes take effect immediately for all users
          </Typography>
        </Alert>
      </Stack>
    </Paper>
  );
}
