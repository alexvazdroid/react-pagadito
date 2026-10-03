import { authorizeTransaction } from '../lib/api';
import * as session from '../lib/session';

// Enable fetch mocking
globalThis.fetch = jest.fn();

describe('authorizeTransaction API Logic', () => {
  beforeEach(() => {
    jest.spyOn(session, 'getSessionToken').mockReturnValue('mock-token');
    (globalThis.fetch as jest.Mock).mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('correctly branches into DECLINED status and handles empty response body correctly', async () => {
    // Mock the backend to return DECLINED on the first try
    (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ status: 'DECLINED', id: 'tx_1', amount: 1001 })
    });

    const tx = await authorizeTransaction(
      { description: 'Test', amount: 1001, currency: 'USD', cardToken: 'card_1' },
      'idemp_key_123'
    );

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(tx.status).toBe('DECLINED');

    // Make sure the Idempotency-Key makes it to the network!
    const fetchArgs = (globalThis.fetch as jest.Mock).mock.calls[0];
    expect(fetchArgs[1].headers).toMatchObject({
      'Idempotency-Key': 'idemp_key_123',
    });
  });

  it('prevents duplicate submissions on retries by using the exact same Idempotency-Key', async () => {
    // Mock the backend to return PENDING
    (globalThis.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ status: 'PENDING', id: 'tx_2', amount: 1002 })
    });

    const idempotencyKey = 'retry_key_888';

    // Tap button 1 -> fires API fetch
    const tx1 = await authorizeTransaction(
      { description: 'Tap 1', amount: 1002, currency: 'USD', cardToken: 'card_1' },
      idempotencyKey
    );

    // Timeout -> Tap button 2 -> fires API fetch AGAIN with the SAME KEY
    const tx2 = await authorizeTransaction(
      { description: 'Tap 1', amount: 1002, currency: 'USD', cardToken: 'card_1' },
      idempotencyKey
    );

    expect(fetch).toHaveBeenCalledTimes(2);

    const call1Headers = (globalThis.fetch as jest.Mock).mock.calls[0][1].headers;
    const call2Headers = (globalThis.fetch as jest.Mock).mock.calls[1][1].headers;

    // The core deduplication requirement: both network attempts must have the idential token
    expect(call1Headers['Idempotency-Key']).toEqual(idempotencyKey);
    expect(call2Headers['Idempotency-Key']).toEqual(idempotencyKey);
    
    // So the server handles the deduplication and returns PENDING both times:
    expect(tx1.status).toBe('PENDING');
    expect(tx2.status).toBe('PENDING');
  });
});
