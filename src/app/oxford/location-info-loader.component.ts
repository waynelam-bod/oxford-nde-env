import { Component, OnInit, inject } from '@angular/core';
import { LocationInfoService } from '../services/location-info.service';

@Component({
  selector: 'custom-location-info-loader',
  standalone: true,
  imports: [],
  template: ''
})
export class LocationInfoLoaderComponent implements OnInit {
  private readonly locationInfoService = inject(LocationInfoService);

  ngOnInit(): void {
    // Initialize the service which will attach info icons to location titles
    this.locationInfoService.initialize();
  }
}
