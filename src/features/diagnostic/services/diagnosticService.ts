import type {
  Message,
  DiagnosticResponse,
  SendMessageRequest,
  EquipmentContext,
  DiagnosticSession,
  DiagnosticSessionListResponse,
  DiagnosticMode,
} from '../types';

/**
 * Service for diagnostic chat operations
 *
 * Currently uses mock AI responses for MVP
 * Will be replaced with real Claude API integration later
 */
class DiagnosticService {
  private sessions: Map<string, DiagnosticSession> = new Map();
  private messageIdCounter = 0;
  private sessionIdCounter = 0;

  /**
   * Send a message and get AI response
   * Currently returns mock responses, will integrate with Claude API later
   */
  async sendMessage(request: SendMessageRequest): Promise<Message> {
    // Simulate network delay
    await this.delay(800);

    // Generate AI response based on the message content
    const aiResponse = this.generateMockResponse(request);

    // Return as a Message object
    return {
      id: this.generateMessageId(),
      role: 'assistant',
      content: aiResponse.message,
      timestamp: new Date(),
    };
  }

  /**
   * Generate a mock AI response based on the user's message
   * This will be replaced with real Claude API calls
   */
  private generateMockResponse(request: SendMessageRequest): DiagnosticResponse {
    const message = request.content.toLowerCase();
    const context = request.equipmentContext;

    // Simple keyword-based responses for MVP
    if (message.includes('not cooling') || message.includes('no cool')) {
      return this.getNotCoolingResponse(context);
    }

    if (message.includes('not heating') || message.includes('no heat')) {
      return this.getNotHeatingResponse(context);
    }

    if (message.includes('noisy') || message.includes('noise') || message.includes('loud')) {
      return this.getNoisyResponse(context);
    }

    if (message.includes('leak') || message.includes('water')) {
      return this.getLeakResponse(context);
    }

    if (message.includes('superheat') || message.includes('subcool')) {
      return this.getSuperheatResponse();
    }

    if (message.includes('pressure') || message.includes('psi')) {
      return this.getPressureResponse(context);
    }

    // Default response
    return {
      message:
        "I'm your HVAC diagnostic assistant. I can help you troubleshoot issues like:\n\n" +
        '• System not cooling or heating\n' +
        '• Unusual noises\n' +
        '• Leaks or water issues\n' +
        '• Pressure and refrigerant questions\n' +
        '• Superheat and subcooling calculations\n\n' +
        'What issue are you experiencing?',
      suggestions: [
        'System not cooling',
        'Strange noise from unit',
        'Calculate superheat',
        'Check refrigerant pressure',
      ],
    };
  }

  private getNotCoolingResponse(context?: EquipmentContext): DiagnosticResponse {
    const systemInfo = context?.systemType
      ? ` for your ${context.systemType.replace(/_/g, ' ')}`
      : '';

    return {
      message:
        `Let's diagnose the no cooling issue${systemInfo}. Here's a systematic approach:\n\n` +
        '**1. Check the Basics**\n' +
        '• Thermostat set to COOL and below room temp?\n' +
        '• Breakers and disconnects on?\n' +
        '• Air filter clean?\n\n' +
        '**2. Outdoor Unit**\n' +
        '• Is the compressor running?\n' +
        '• Is the condenser fan running?\n' +
        '• What are the pressures? (High/Low side)\n\n' +
        '**3. Indoor Unit**\n' +
        '• Is the blower running?\n' +
        '• Air flow adequate?\n' +
        '• Return and supply temps?\n\n' +
        'What have you checked so far?',
      suggestions: [
        'Compressor not running',
        'Low refrigerant suspected',
        'Blower running but no cool air',
      ],
      confidence: 0.9,
    };
  }

  private getNotHeatingResponse(context?: EquipmentContext): DiagnosticResponse {
    const isHeatPump = context?.systemType === 'heat_pump';

    if (isHeatPump) {
      return {
        message:
          "Heat pump not heating - Let's troubleshoot:\n\n" +
          '**1. Basics**\n' +
          '• Thermostat in HEAT mode?\n' +
          '• Emergency heat switch off?\n' +
          '• Outdoor temp? (Heat pumps lose efficiency below 35°F)\n\n' +
          '**2. Reversing Valve**\n' +
          '• Is the reversing valve energized?\n' +
          '• Hearing hissing sounds?\n\n' +
          '**3. Defrost Cycle**\n' +
          '• Unit in defrost mode? (Normal every 30-90 min in cold weather)\n' +
          '• Defrost sensor working?\n\n' +
          'What readings do you have?',
        suggestions: ['Check reversing valve', 'Outdoor temp below 35°F', 'Defrost issue'],
      };
    }

    return {
      message:
        'Furnace not heating - Systematic check:\n\n' +
        '**1. Power & Thermostat**\n' +
        '• Gas valve open?\n' +
        '• Thermostat calling for heat?\n' +
        '• Breaker/fuse OK?\n\n' +
        '**2. Ignition System**\n' +
        '• Hearing igniter click?\n' +
        '• Flame sensor clean?\n' +
        '• Burners lighting?\n\n' +
        '**3. Safety Switches**\n' +
        '• Pressure switch closed?\n' +
        '• Flame rollout switch OK?\n' +
        '• Limit switch tripped?\n\n' +
        'Where are you in the troubleshooting process?',
      suggestions: ['Igniter not working', 'Pressure switch issue', 'Flame sensor dirty'],
    };
  }

  // eslint-disable-next-line no-unused-vars
  private getNoisyResponse(_context?: EquipmentContext): DiagnosticResponse {
    return {
      message:
        'Unusual noise troubleshooting:\n\n' +
        '**Type of noise?**\n' +
        '• **Squealing/Screeching**: Likely belt or bearing\n' +
        '• **Banging/Clanking**: Loose component or compressor issue\n' +
        '• **Hissing**: Refrigerant leak or expansion valve\n' +
        '• **Clicking**: Relay or contactor issue\n' +
        '• **Humming**: Capacitor or motor starting issue\n\n' +
        '**Location**\n' +
        '• Indoor unit or outdoor unit?\n' +
        '• Constant or intermittent?\n' +
        '• When does it occur? (Startup, running, shutdown)\n\n' +
        'What type of noise are you hearing?',
      suggestions: [
        'Squealing from blower',
        'Banging in outdoor unit',
        'Hissing sound - possible leak',
      ],
    };
  }

  // eslint-disable-next-line no-unused-vars
  private getLeakResponse(_context?: EquipmentContext): DiagnosticResponse {
    return {
      message:
        'Water leak diagnosis:\n\n' +
        '**Common causes:**\n' +
        '1. **Condensate Drain Clogged**\n' +
        '   • Check drain line for blockage\n' +
        '   • Float switch working?\n' +
        '   • Drain pan rusted through?\n\n' +
        '2. **Frozen Evaporator Coil**\n' +
        '   • Low airflow (dirty filter?)\n' +
        '   • Low refrigerant\n' +
        '   • Blower speed too low\n\n' +
        '3. **Improper Installation**\n' +
        '   • Unit not level\n' +
        '   • Drain line pitched wrong\n\n' +
        'Where exactly is the water coming from?',
      suggestions: ['Clear condensate drain', 'Check for frozen coil', 'Verify unit is level'],
    };
  }

  private getSuperheatResponse(): DiagnosticResponse {
    return {
      message:
        '**Superheat Calculation**\n\n' +
        'Superheat = Suction Line Temp - Evaporator Saturation Temp\n\n' +
        '**Steps:**\n' +
        '1. Measure suction line temperature at service valve\n' +
        '2. Read suction pressure (low side)\n' +
        '3. Convert pressure to saturation temp (use P/T chart)\n' +
        '4. Subtract saturation temp from line temp\n\n' +
        '**Target Superheat**\n' +
        '• Fixed orifice: 8-12°F (depends on conditions)\n' +
        '• TXV systems: 10-15°F\n\n' +
        '**High superheat** (>15°F): Low refrigerant or restricted TXV\n' +
        '**Low superheat** (<5°F): Overcharge or TXV flooding\n\n' +
        'What are your readings?',
      suggestions: ['Calculate subcooling instead', 'Check refrigerant charge'],
    };
  }

  private getPressureResponse(context?: EquipmentContext): DiagnosticResponse {
    const refrigerant = context?.refrigerant || 'R-410A';

    return {
      message:
        `**${refrigerant} Pressure Guidelines**\n\n` +
        '**Normal Operating Pressures** (70°F ambient):\n' +
        `• Low side: ${refrigerant === 'R-410A' ? '115-125 PSI' : '55-70 PSI'}\n` +
        `• High side: ${refrigerant === 'R-410A' ? '250-300 PSI' : '200-250 PSI'}\n\n` +
        '**Diagnosing Pressure Issues:**\n\n' +
        '**Both pressures low**\n' +
        '• Low refrigerant charge\n' +
        '• Compressor not pumping\n\n' +
        '**Both pressures high**\n' +
        '• Overcharged system\n' +
        '• Condenser airflow restricted\n' +
        '• Non-condensables in system\n\n' +
        '**Low high, high low**\n' +
        '• TXV stuck or restricted\n' +
        '• Filter/drier clogged\n\n' +
        'What pressures are you seeing?',
      suggestions: ['System is low on refrigerant', 'High pressure too high', 'Equal pressures'],
    };
  }

  /**
   * Create a new diagnostic session
   */
  async createSession(
    companyId: string,
    clientId: string,
    technicianId: string,
    technicianName: string,
    mode: DiagnosticMode = 'expert',
    jobId?: string,
    equipmentId?: string
  ): Promise<DiagnosticSession> {
    await this.delay(200);

    this.sessionIdCounter++;
    const now = new Date();

    const session: DiagnosticSession = {
      id: `session_${this.sessionIdCounter}`,
      companyId,
      clientId,
      jobId,
      equipmentId,
      messages: [],
      mode,
      createdBy: technicianId,
      createdByName: technicianName,
      createdAt: now,
      modifiedBy: technicianId,
      modifiedByName: technicianName,
      updatedAt: now,
    };

    this.sessions.set(session.id, session);
    return session;
  }

  /**
   * Get a diagnostic session by ID
   */
  async getSession(id: string): Promise<DiagnosticSession> {
    await this.delay(100);

    const session = this.sessions.get(id);
    if (!session) {
      throw new Error(`Diagnostic session with id ${id} not found`);
    }

    return session;
  }

  /**
   * Get all diagnostic sessions for a client
   */
  async getSessionsByClient(
    companyId: string,
    clientId: string
  ): Promise<DiagnosticSessionListResponse> {
    await this.delay(200);

    const items = Array.from(this.sessions.values())
      .filter((session) => session.companyId === companyId && session.clientId === clientId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return {
      items,
      total: items.length,
    };
  }

  /**
   * Get all diagnostic sessions (for history view)
   */
  async getAllSessions(companyId: string): Promise<DiagnosticSessionListResponse> {
    await this.delay(200);

    const items = Array.from(this.sessions.values())
      .filter((session) => session.companyId === companyId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return {
      items,
      total: items.length,
    };
  }

  /**
   * Add a message to an existing session
   */
  async addMessageToSession(
    sessionId: string,
    request: SendMessageRequest
  ): Promise<DiagnosticSession> {
    const session = await this.getSession(sessionId);

    // Add user message
    const userMessage: Message = {
      id: this.generateMessageId(),
      role: 'user',
      content: request.content,
      timestamp: new Date(),
    };

    session.messages.push(userMessage);

    // Get AI response
    const aiMessage = await this.sendMessage(request);
    session.messages.push(aiMessage);

    // Update session timestamp
    session.updatedAt = new Date();
    this.sessions.set(sessionId, session);

    return session;
  }

  /**
   * Complete a diagnostic session
   */
  async completeSession(sessionId: string, summary?: string): Promise<DiagnosticSession> {
    await this.delay(200);

    const session = await this.getSession(sessionId);

    session.completedAt = new Date();
    session.updatedAt = new Date();

    if (summary) {
      session.summary = summary;
    } else {
      // Auto-generate a basic summary
      const messageCount = session.messages.length;
      session.summary = `Diagnostic session with ${messageCount} messages`;
    }

    this.sessions.set(sessionId, session);
    return session;
  }

  /**
   * Generate a unique message ID
   */
  private generateMessageId(): string {
    this.messageIdCounter++;
    return `msg_${Date.now()}_${this.messageIdCounter}`;
  }

  /**
   * Simulate network delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const diagnosticService = new DiagnosticService();
