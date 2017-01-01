import { Component } from '@angular/core';
import { Router, ROUTER_DIRECTIVES } from '@angular/router';
import { CORE_DIRECTIVES, FORM_DIRECTIVES } from '@angular/common';
declare var jQuery: any;
import {Http} from '@angular/http';
import globals = require('../../globals');
import 'rxjs/Rx';

@Component({
	moduleId: module.id,
	selector: 'sidebar-cmp',
	templateUrl: 'sidebar.html',
	directives: [ROUTER_DIRECTIVES, CORE_DIRECTIVES, FORM_DIRECTIVES]
})

export class SidebarComponent {
	isActive = false;
	studentLevel: boolean;
  profLevel: boolean;
	showMenu: string = '';
  classes: Array<any> = [];
	eventCalled() {
		this.isActive = !this.isActive;
	}
	addExpandClass(element: any) {
		if (element === this.showMenu) {
			this.showMenu = '0';
		} else {
			this.showMenu = element;
		}
	}
  gotoAnnotationID() {
    let annotationID = prompt('Enter annotation ID.');
    this._router.navigate(['/dashboard', '/in-progress', annotationID]);
  }
  classUpdate() {
    let scope = this;
    let gotClasses = function (data: any) {
      scope.classes = data.classes;
    };
    let body = JSON.stringify({
      'token': localStorage.getItem('uaToken')
    });
    this._http.post(globals.backendURL + '/restricted/classes/list', body, globals.options)
      .map(res => res.json())
      .subscribe(
        data => gotClasses(data),
        err => console.log(err),
        () => console.log('Got classes')
      );
  }
  gotoFirstClass() {
    this._router.navigate(['/dashboard', '/class-student', this.classes[0].id]);
  }
  constructor( private _router: Router, private _http: Http ) {
    let scope = this;
    let gotLevel = function (data: any) {
      if (data.level === 0) {
        scope.studentLevel = true;
        scope.profLevel = false;
      } else {
        scope.studentLevel = false;
        scope.profLevel = true;
        let profColor = '#607D8B';
        jQuery('.topnav').css('background-color', profColor);
        jQuery('#toggle-sidebar').css('background-color', profColor);
      }
    };
    let body = JSON.stringify({
      'token': localStorage.getItem('uaToken')
    });
    this._http.post(globals.backendURL + '/restricted/user', body, globals.options)
      .map(res => res.json())
      .subscribe(
        data => gotLevel(data),
        err => console.log(err),
        () => console.log('Got level')
      );
    this.classUpdate();
  }
}
