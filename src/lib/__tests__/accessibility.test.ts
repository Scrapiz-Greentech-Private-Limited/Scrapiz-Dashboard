/**
 * Accessibility Tests
 * Tests for color contrast and accessibility utilities
 */

import {
  getRelativeLuminance,
  getContrastRatio,
  meetsWCAGAA,
  meetsWCAGAAA,
} from '../accessibility';

describe('Accessibility Utilities', () => {
  describe('getRelativeLuminance', () => {
    it('should calculate luminance for black', () => {
      const luminance = getRelativeLuminance(0, 0, 0);
      expect(luminance).toBe(0);
    });

    it('should calculate luminance for white', () => {
      const luminance = getRelativeLuminance(255, 255, 255);
      expect(luminance).toBe(1);
    });

    it('should calculate luminance for green primary', () => {
      // Green primary: #22c55e (34, 197, 94)
      const luminance = getRelativeLuminance(34, 197, 94);
      expect(luminance).toBeGreaterThan(0);
      expect(luminance).toBeLessThan(1);
    });
  });

  describe('getContrastRatio', () => {
    it('should return 21:1 for black on white', () => {
      const ratio = getContrastRatio([0, 0, 0], [255, 255, 255]);
      expect(ratio).toBeCloseTo(21, 0);
    });

    it('should return 1:1 for same colors', () => {
      const ratio = getContrastRatio([128, 128, 128], [128, 128, 128]);
      expect(ratio).toBe(1);
    });

    it('should be symmetric', () => {
      const ratio1 = getContrastRatio([0, 0, 0], [255, 255, 255]);
      const ratio2 = getContrastRatio([255, 255, 255], [0, 0, 0]);
      expect(ratio1).toBe(ratio2);
    });
  });

  describe('meetsWCAGAA', () => {
    it('should pass for black text on white background', () => {
      expect(meetsWCAGAA([0, 0, 0], [255, 255, 255])).toBe(true);
    });

    it('should pass for green primary on white', () => {
      // Green primary: #22c55e (34, 197, 94)
      expect(meetsWCAGAA([34, 197, 94], [255, 255, 255])).toBe(true);
    });

    it('should fail for light gray on white', () => {
      expect(meetsWCAGAA([200, 200, 200], [255, 255, 255])).toBe(false);
    });

    it('should have lower threshold for large text', () => {
      // A color that passes for large text but not normal text
      const foreground: [number, number, number] = [150, 150, 150];
      const background: [number, number, number] = [255, 255, 255];
      
      const ratio = getContrastRatio(foreground, background);
      
      // Should fail for normal text (needs 4.5:1)
      expect(meetsWCAGAA(foreground, background, false)).toBe(ratio >= 4.5);
      
      // Should pass for large text (needs 3:1)
      expect(meetsWCAGAA(foreground, background, true)).toBe(ratio >= 3);
    });
  });

  describe('meetsWCAGAAA', () => {
    it('should pass for black text on white background', () => {
      expect(meetsWCAGAAA([0, 0, 0], [255, 255, 255])).toBe(true);
    });

    it('should have stricter requirements than AA', () => {
      // A color that passes AA but not AAA
      const foreground: [number, number, number] = [100, 100, 100];
      const background: [number, number, number] = [255, 255, 255];
      
      const passesAA = meetsWCAGAA(foreground, background);
      const passesAAA = meetsWCAGAAA(foreground, background);
      
      // If it passes AAA, it must pass AA
      if (passesAAA) {
        expect(passesAA).toBe(true);
      }
    });
  });

  describe('Color Contrast Verification', () => {
    // Test actual colors used in the application
    const white: [number, number, number] = [255, 255, 255];
    const greenPrimary: [number, number, number] = [34, 197, 94]; // #22c55e
    const darkGreenText: [number, number, number] = [26, 77, 46]; // Approximate hsl(140, 10%, 20%)
    const mutedForeground: [number, number, number] = [115, 115, 115]; // Approximate

    it('should verify green primary on white meets AA', () => {
      expect(meetsWCAGAA(greenPrimary, white)).toBe(true);
    });

    it('should verify dark green text on white meets AA', () => {
      expect(meetsWCAGAA(darkGreenText, white)).toBe(true);
    });

    it('should verify white text on green primary meets AA', () => {
      expect(meetsWCAGAA(white, greenPrimary)).toBe(true);
    });

    it('should log contrast ratios for documentation', () => {
      const ratios = {
        'Green Primary on White': getContrastRatio(greenPrimary, white),
        'Dark Green Text on White': getContrastRatio(darkGreenText, white),
        'White on Green Primary': getContrastRatio(white, greenPrimary),
        'Muted Foreground on White': getContrastRatio(mutedForeground, white),
      };

      // Log for documentation purposes
      console.log('Color Contrast Ratios:', ratios);

      // Verify all meet minimum standards
      Object.entries(ratios).forEach(([name, ratio]) => {
        expect(ratio).toBeGreaterThanOrEqual(3); // At least AA for large text
      });
    });
  });
});
