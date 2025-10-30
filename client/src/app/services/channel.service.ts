import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, shareReplay, tap } from 'rxjs/operators';
import { Observable, forkJoin } from 'rxjs';

import { Channel, Program } from '../models/channel.model';

export interface ChannelGuide extends Channel {
  currentProgram?: Program;
  upcomingPrograms: Program[];
}

@Injectable({ providedIn: 'root' })
export class ChannelService {
  private readonly apiBase = '/api';
  private readonly channelsSignal = signal<Channel[]>([]);
  private readonly programsSignal = signal<Program[]>([]);

  constructor(private readonly http: HttpClient) {}

  loadGuide(): Observable<ChannelGuide[]> {
    return forkJoin({
      channels: this.http.get<Channel[]>(`${this.apiBase}/channels`),
      programs: this.http.get<Program[]>(`${this.apiBase}/programs`)
    }).pipe(
      tap(({ channels, programs }) => {
        this.channelsSignal.set(channels);
        this.programsSignal.set(programs);
      }),
      map(({ channels, programs }) => this.mapToGuide(channels, programs)),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }

  get channelGuide(): ChannelGuide[] {
    return this.mapToGuide(this.channelsSignal(), this.programsSignal());
  }

  private mapToGuide(channels: Channel[], programs: Program[]): ChannelGuide[] {
    const now = new Date();
    const byChannel = programs.reduce<Record<string, Program[]>>((acc, program) => {
      (acc[program.channelId] ||= []).push(program);
      return acc;
    }, {});

    Object.values(byChannel).forEach((items) =>
      items.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
    );

    return channels.map((channel) => {
      const channelPrograms = byChannel[channel.id] ?? [];
      const currentProgram = channelPrograms.find((program) => {
        const start = new Date(program.start).getTime();
        const end = new Date(program.end).getTime();
        const nowTime = now.getTime();
        return nowTime >= start && nowTime <= end;
      });

      const upcomingPrograms = currentProgram
        ? channelPrograms.filter((program) => new Date(program.start).getTime() > new Date(currentProgram.end).getTime())
        : channelPrograms;

      return {
        ...channel,
        currentProgram,
        upcomingPrograms
      };
    });
  }
}
