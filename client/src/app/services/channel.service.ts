import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, shareReplay, tap } from 'rxjs/operators';
import { Observable, forkJoin, throwError } from 'rxjs';

import { Channel, Program } from '../models/channel.model';

export interface ChannelGuide extends Channel {
  currentProgram?: Program;
  upcomingPrograms: Program[];
}

export interface GuideLoadResult {
  guide: ChannelGuide[];
  usingFallback: boolean;
}

interface WithFallback<T> {
  data: T;
  usedFallback: boolean;
}

interface ProgramTemplate {
  channelId: string;
  title: string;
  description: string;
  startOffset: number;
  duration: number;
}

@Injectable({ providedIn: 'root' })
export class ChannelService {
  private readonly apiBase = '/api';
  private readonly channelsSignal = signal<Channel[]>([]);
  private readonly programsSignal = signal<Program[]>([]);
  private readonly fallbackSignal = signal(false);

  constructor(private readonly http: HttpClient) {}

  loadGuide(): Observable<GuideLoadResult> {
    this.fallbackSignal.set(false);
    return forkJoin({
      channels: this.fetchWithFallback<Channel[]>(`${this.apiBase}/channels`, 'assets/data/channels.json'),
      programs: this.fetchWithFallback<Program[], ProgramTemplate[]>(
        `${this.apiBase}/programs`,
        'assets/data/programs.json',
        (templates) => this.mapProgramTemplates(templates)
      )
    }).pipe(
      tap(({ channels, programs }) => {
        this.channelsSignal.set(channels.data);
        this.programsSignal.set(programs.data);
        this.fallbackSignal.set(channels.usedFallback || programs.usedFallback);
      }),
      map(({ channels, programs }) => ({
        guide: this.mapToGuide(channels.data, programs.data),
        usingFallback: channels.usedFallback || programs.usedFallback
      })),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }

  get channelGuide(): ChannelGuide[] {
    return this.mapToGuide(this.channelsSignal(), this.programsSignal());
  }

  get isUsingFallback(): boolean {
    return this.fallbackSignal();
  }

  private fetchWithFallback<T, F = T>(
    primaryUrl: string,
    fallbackUrl: string,
    fallbackMapper?: (data: F) => T
  ): Observable<WithFallback<T>> {
    return this.http.get<T>(primaryUrl).pipe(
      map((data) => ({ data, usedFallback: false })),
      catchError(() =>
        this.http.get<F>(fallbackUrl).pipe(
          map((data) => ({
            data: fallbackMapper ? fallbackMapper(data) : (data as unknown as T),
            usedFallback: true
          })),
          catchError(() => {
            this.fallbackSignal.set(false);
            return throwError(() => new Error('Unable to load data'));
          })
        )
      )
    );
  }

  private mapProgramTemplates(templates: ProgramTemplate[], now = new Date()): Program[] {
    return templates.map((template, index) => {
      const start = new Date(now.getTime() + template.startOffset * 60 * 1000);
      const end = new Date(start.getTime() + template.duration * 60 * 1000);

      return {
        id: `${template.channelId}-${index}`,
        channelId: template.channelId,
        title: template.title,
        description: template.description,
        start: start.toISOString(),
        end: end.toISOString()
      };
    });
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
