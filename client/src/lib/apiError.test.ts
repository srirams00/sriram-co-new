import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { extractErrorMessage } from './api';

describe('API Error Extraction Suite', () => {
  it('extracts formatted validation detail messages from Zod error response', async () => {
    const mockResponse = new Response(
      JSON.stringify({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: [
            { path: 'image', message: 'Image must use secure https://, local path, or valid image upload data' },
            { path: 'price', message: 'Price must be greater than 0' },
          ],
        },
      }),
      { status: 422, headers: { 'Content-Type': 'application/json' } }
    );

    const message = await extractErrorMessage(mockResponse, 'Failed to create product');
    assert.equal(
      message,
      'image: Image must use secure https://, local path, or valid image upload data; price: Price must be greater than 0'
    );
  });

  it('extracts top-level error.message when no details array is present', async () => {
    const mockResponse = new Response(
      JSON.stringify({
        error: {
          code: 'FORBIDDEN_ADMIN_ONLY',
          message: 'Forbidden: Admin privileges required',
        },
      }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );

    const message = await extractErrorMessage(mockResponse, 'Failed to create product');
    assert.equal(message, 'Forbidden: Admin privileges required');
  });

  it('extracts data.message on 404 response for unregistered email during password reset', async () => {
    const mockResponse = new Response(
      JSON.stringify({
        success: false,
        message: 'No account found with this email address. Please check your email or register for a new account.',
      }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    );

    const message = await extractErrorMessage(mockResponse, 'Failed to send reset link');
    assert.equal(
      message,
      'No account found with this email address. Please check your email or register for a new account.'
    );
  });

  it('provides helpful human message for 401 Unauthorized when body is empty or non-JSON', async () => {
    const mockResponse = new Response('Unauthorized', { status: 401 });
    const message = await extractErrorMessage(mockResponse, 'Failed to create product');
    assert.equal(message, 'Your session has expired or authentication is required. Please log in again.');
  });

  it('provides helpful human message for 404 Not Found when body is empty or non-JSON', async () => {
    const mockResponse = new Response('Not Found', { status: 404 });
    const message = await extractErrorMessage(mockResponse, 'Failed to fetch resource');
    assert.equal(message, 'The requested resource or endpoint was not found.');
  });

  it('provides helpful human message for 413 Payload Too Large', async () => {
    const mockResponse = new Response('Payload Too Large', { status: 413 });
    const message = await extractErrorMessage(mockResponse, 'Failed to upload');
    assert.equal(message, 'The uploaded image or file is too large for the server. Please compress or resize it.');
  });
});
