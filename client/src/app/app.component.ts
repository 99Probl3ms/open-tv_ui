import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChannelCardComponent } from './components/channel-card/channel-card.component';
import { CategoryFilterComponent } from './components/category-filter/category-filter.component';
import { ChannelGuide, ChannelService } from './services/channel.service';

interface TabOption {
  id: 'all' | 'categories' | 'history' | 'favorites';
  label: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, ChannelCardComponent, CategoryFilterComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  readonly title = 'Open TV UI';
  readonly tabs: TabOption[] = [
    { id: 'all', label: 'All' },
    { id: 'categories', label: 'Categories' },
    { id: 'history', label: 'History' },
    { id: 'favorites', label: 'Favorites' }
  ];

  readonly isLoading = signal(true);
  readonly error = signal<string | null>(null);
  readonly searchTerm = signal('');
  readonly activeTab = signal<TabOption['id']>('all');
  readonly activeCategory = signal('All');
  readonly guide = signal<ChannelGuide[]>([]);
  readonly watchHistory = signal<string[]>([]);

  readonly categories = computed(() => {
    const base = Array.from(new Set(this.guide().map((channel) => channel.category))).sort();
    return ['All', ...base];
  });

  readonly visibleChannels = computed(() => {
    const normalizedSearch = this.searchTerm().toLowerCase();
    const activeCategory = this.activeCategory();
    const tab = this.activeTab();

    return this.guide()
      .filter((channel) => {
        if (tab === 'favorites') {
          return channel.favorite;
        }
        if (tab === 'history') {
          return this.watchHistory().includes(channel.id);
        }
        return true;
      })
      .filter((channel) => (activeCategory === 'All' ? true : channel.category === activeCategory))
      .filter((channel) =>
        normalizedSearch.length === 0
          ? true
          : channel.name.toLowerCase().includes(normalizedSearch) ||
            channel.category.toLowerCase().includes(normalizedSearch)
      );
  });

  constructor(private readonly channelService: ChannelService) {}

  ngOnInit(): void {
    this.channelService.loadGuide().subscribe({
      next: (channels) => {
        this.guide.set(channels);
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set('Unable to load the guide right now.');
        this.isLoading.set(false);
      }
    });
  }

  onSearch(term: string): void {
    this.searchTerm.set(term);
  }

  onTabChange(tab: TabOption['id']): void {
    this.activeTab.set(tab);
    if (tab === 'favorites') {
      this.activeCategory.set('All');
    }
    if (tab === 'all') {
      this.activeCategory.set('All');
    }
  }

  onCategoryChange(category: string): void {
    this.activeCategory.set(category);
    this.activeTab.set('categories');
  }

  onFavoriteToggled(channel: ChannelGuide): void {
    const next = this.guide().map((item) =>
      item.id === channel.id
        ? {
            ...item,
            favorite: !item.favorite
          }
        : item
    );
    this.guide.set(next);
  }

  onChannelSelected(channel: ChannelGuide): void {
    const existing = this.watchHistory();
    const filtered = existing.filter((id) => id !== channel.id);
    this.watchHistory.set([channel.id, ...filtered].slice(0, 6));
  }
}
