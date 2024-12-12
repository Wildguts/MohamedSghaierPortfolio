import { Component, AfterViewInit, ElementRef, Renderer2, ViewChild, Inject, PLATFORM_ID, OnInit } from '@angular/core';
import * as THREE from 'three';
import * as dat from 'lil-gui';
import gsap from 'gsap';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule,RouterOutlet],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'mohamedSghaierCV';


}
