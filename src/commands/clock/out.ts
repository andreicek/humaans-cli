import {Args} from '@oclif/core'
import fetch from 'node-fetch'

import {TimesheetCommand} from '../../timesheet-command.js'
import {HumaansTimesheetEntry} from '../../types.js'

export default class ClockOut extends TimesheetCommand {
  static args = {
    time: Args.string({description: 'Time at which to clock out'}),
  }

  static description = 'Clock out'

  static examples = ['<%= config.bin %> <%= command.id %>', '<%= config.bin %> <%= command.id %> 17:00']

  public async run(): Promise<void> {
    const lastTimesheetEntry = await this.getLastTimesheetEntry()

    if (!lastTimesheetEntry || lastTimesheetEntry.endTime) {
      this.log(`You're not clocked in.`)
      this.exit()
    }

    this.clockOut(lastTimesheetEntry)
  }

  private async clockOut(timesheetEntry: HumaansTimesheetEntry) {
    const {args} = await this.parse(ClockOut)

    const time = args.time ?? this.getCurrentTime()

    const body = {
      endTime: time,
    }

    const response = await fetch(`https://app.humaans.io/api/timesheet-entries/${timesheetEntry.id}`, {
      body: JSON.stringify(body),
      headers: {Authorization: `Bearer ${this.auth.token}`, 'Content-Type': 'application/json'},
      method: 'patch',
    })

    if (response.status !== 200) {
      this.logHumaansApiError(response)
      this.exit(1)
    }

    const data = (await response.json()) as HumaansTimesheetEntry

    this.log(`Clocked out at ${data.endTime} ✅`)
  }
}
