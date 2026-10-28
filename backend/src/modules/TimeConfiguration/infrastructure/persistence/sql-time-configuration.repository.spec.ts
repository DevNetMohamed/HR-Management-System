import { DataSource } from 'typeorm';
import { SqlTimeConfigurationRepository } from './sql-time-configuration.repository';
import { validDate } from '../../domain/value-objects/calendar-date';

describe('time configuration holiday resolution', () => {
  const holiday = {
    id: 'holiday-1',
    name: 'Labour Day',
    branch_id: null,
    recurrence: 'yearly',
    start_date: null,
    end_date: null,
    start_month: 5,
    start_day: 1,
    duration_days: 1,
    first_year: 2026,
    last_year: null,
  };

  function service(holidays: object[], overrides: object[] = []) {
    const query = jest
      .fn()
      .mockResolvedValueOnce(holidays)
      .mockResolvedValueOnce(overrides);
    return {
      time: new SqlTimeConfigurationRepository({
        query,
      } as unknown as DataSource),
      query,
    };
  }

  it('resolves May 1 in successive years without stored yearly copies', async () => {
    const { time } = service([holiday]);
    expect(
      await time.listHolidays('company', {
        from: '2026-05-01',
        to: '2027-05-01',
      }),
    ).toEqual([
      expect.objectContaining({
        startDate: '2026-05-01',
        occurrenceYear: 2026,
      }),
      expect.objectContaining({
        startDate: '2027-05-01',
        occurrenceYear: 2027,
      }),
    ]);
  });

  it('applies a cancellation to one year only', async () => {
    const { time } = service(
      [holiday],
      [
        {
          holiday_id: 'holiday-1',
          occurrence_year: 2026,
          status: 'cancelled',
          start_date: null,
          end_date: null,
        },
      ],
    );
    const result = await time.listHolidays('company', {
      from: '2026-01-01',
      to: '2027-12-31',
    });
    expect(result.map((x) => x.occurrenceYear)).toEqual([2027]);
  });

  it('includes multi-day annual holidays crossing New Year', async () => {
    const { time } = service([
      { ...holiday, start_month: 12, start_day: 31, duration_days: 3 },
    ]);
    const result = await time.listHolidays('company', {
      from: '2027-01-01',
      to: '2027-01-02',
    });
    expect(result).toEqual([
      expect.objectContaining({
        startDate: '2026-12-31',
        endDate: '2027-01-02',
      }),
    ]);
  });

  it('skips February 29 in non-leap years', async () => {
    const { time } = service([{ ...holiday, start_month: 2, start_day: 29 }]);
    const result = await time.listHolidays('company', {
      from: '2027-01-01',
      to: '2028-12-31',
    });
    expect(result.map((x) => x.startDate)).toEqual(['2028-02-29']);
  });

  it('allows a specific non-leap-year occurrence to be moved explicitly', async () => {
    const { time } = service(
      [{ ...holiday, start_month: 2, start_day: 29 }],
      [
        {
          holiday_id: 'holiday-1',
          occurrence_year: 2027,
          status: 'modified',
          start_date: '2027-02-28',
          end_date: '2027-02-28',
        },
      ],
    );
    const result = await time.listHolidays('company', {
      from: '2027-02-28',
      to: '2027-02-28',
    });
    expect(result.map((x) => x.startDate)).toEqual(['2027-02-28']);
  });

  it('rejects impossible dates', () => {
    expect(validDate('2027-02-29')).toBe(false);
    expect(validDate('2028-02-29')).toBe(true);
  });
});
