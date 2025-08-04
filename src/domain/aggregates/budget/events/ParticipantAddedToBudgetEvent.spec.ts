import { ParticipantAddedToBudgetEvent } from './ParticipantAddedToBudgetEvent';

describe('ParticipantAddedToBudgetEvent', () => {
  it('should create event with correct properties', () => {
    const aggregateId = 'aggregate-123';
    const budgetId = 'budget-456';
    const participantId = 'participant-789';
    const ownerId = 'owner-101';

    const event = new ParticipantAddedToBudgetEvent(
      aggregateId,
      budgetId,
      participantId,
      ownerId,
    );

    expect(event.aggregateId).toBe(aggregateId);
    expect(event.budgetId).toBe(budgetId);
    expect(event.participantId).toBe(participantId);
    expect(event.ownerId).toBe(ownerId);
    expect(event.occurredOn).toBeInstanceOf(Date);
    expect(event.eventVersion).toBe(1);
  });

  it('should have different timestamps for different events', async () => {
    const event1 = new ParticipantAddedToBudgetEvent('1', '2', '3', '4');

    // Wait 1ms to ensure different timestamps
    await new Promise((resolve) => setTimeout(resolve, 1));

    const event2 = new ParticipantAddedToBudgetEvent('1', '2', '3', '4');

    expect(event1.occurredOn.getTime()).not.toBe(event2.occurredOn.getTime());
  });
});
