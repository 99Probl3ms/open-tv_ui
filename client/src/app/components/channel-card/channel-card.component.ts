import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChannelGuide } from '../../services/channel.service';

@Component({
  selector: 'app-channel-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './channel-card.component.html',
  styleUrls: ['./channel-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChannelCardComponent {
  @Input({ required: true }) channel!: ChannelGuide;
  @Output() favoriteToggled = new EventEmitter<ChannelGuide>();
  @Output() channelSelected = new EventEmitter<ChannelGuide>();

  onToggleFavorite(event: Event): void {
    event.stopPropagation();
    this.favoriteToggled.emit(this.channel);
  }

  onSelect(): void {
    this.channelSelected.emit(this.channel);
  }
}
