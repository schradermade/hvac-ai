import { diagnosticService } from '../diagnosticService';
import type { SendMessageRequest } from '../../types';

describe('DiagnosticService', () => {
  describe('sendMessage', () => {
    it('should return a message with assistant role', async () => {
      const request: SendMessageRequest = {
        content: 'System not cooling',
        mode: 'expert',
      };

      const result = await diagnosticService.sendMessage(request);

      expect(result.role).toBe('assistant');
      expect(result.id).toBeDefined();
      expect(result.timestamp).toBeInstanceOf(Date);
      expect(result.content).toBeTruthy();
    });

    it('should provide cooling diagnostic response', async () => {
      const request: SendMessageRequest = {
        content: 'System not cooling',
      };

      const result = await diagnosticService.sendMessage(request);

      expect(result.content).toContain('cooling');
      expect(result.content.toLowerCase()).toContain('thermostat');
    });

    it('should provide heating diagnostic response', async () => {
      const request: SendMessageRequest = {
        content: 'System not heating',
      };

      const result = await diagnosticService.sendMessage(request);

      expect(result.content.toLowerCase()).toContain('heat');
    });

    it('should provide noise diagnostic response', async () => {
      const request: SendMessageRequest = {
        content: 'Unit is very noisy',
      };

      const result = await diagnosticService.sendMessage(request);

      expect(result.content.toLowerCase()).toContain('noise');
    });

    it('should provide leak diagnostic response', async () => {
      const request: SendMessageRequest = {
        content: 'Water leak from unit',
      };

      const result = await diagnosticService.sendMessage(request);

      expect(result.content.toLowerCase()).toContain('leak');
    });

    it('should provide superheat calculation response', async () => {
      const request: SendMessageRequest = {
        content: 'How do I calculate superheat?',
      };

      const result = await diagnosticService.sendMessage(request);

      expect(result.content).toContain('Superheat');
    });

    it('should provide pressure diagnostic response', async () => {
      const request: SendMessageRequest = {
        content: 'What should the pressure be?',
      };

      const result = await diagnosticService.sendMessage(request);

      expect(result.content.toLowerCase()).toContain('pressure');
    });

    it('should provide default response for unrecognized queries', async () => {
      const request: SendMessageRequest = {
        content: 'Random question',
      };

      const result = await diagnosticService.sendMessage(request);

      expect(result.content).toContain('HVAC diagnostic assistant');
    });

    it('should use equipment context when provided', async () => {
      const request: SendMessageRequest = {
        content: 'System not heating',
        equipmentContext: {
          systemType: 'heat_pump',
        },
      };

      const result = await diagnosticService.sendMessage(request);

      expect(result.content).toContain('heat pump');
    });
  });
});
