import { Routes } from '@angular/router';
import { ExperienceComponent } from './experience/experience.component';
import { AppComponent } from './app.component';
import { LandingComponent } from './landing/landing.component';

export const routes: Routes = [
  {
    path: '', // Default route
    component: ExperienceComponent,
  },
  {
    path: 'experience', // Route for the experience page
    component: LandingComponent,
  },
];
