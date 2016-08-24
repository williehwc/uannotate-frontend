import {Component} from '@angular/core';
import {ROUTER_DIRECTIVES, Router} from '@angular/router';

@Component({
  moduleId: module.id,
	selector: 'ua-phenository-reload',
	templateUrl: 'ua-phenository-reload.html',
  directives: [[ROUTER_DIRECTIVES]]
})


export class PhenositoryReloadComponent {
  constructor( private _router: Router ) {
    this._router.navigate(['/dashboard', '/phenository']);
  }
}
