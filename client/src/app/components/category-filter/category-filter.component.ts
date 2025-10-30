import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-category-filter',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './category-filter.component.html',
  styleUrls: ['./category-filter.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CategoryFilterComponent {
  @Input({ required: true }) categories: string[] = [];
  @Input({ required: true }) activeCategory = 'All';
  @Output() categoryChange = new EventEmitter<string>();

  trackByCategory(_: number, category: string): string {
    return category;
  }

  onCategorySelect(category: string): void {
    this.categoryChange.emit(category);
  }
}
