import {Component, HostListener} from '@angular/core';
import {Router, ROUTER_DIRECTIVES } from '@angular/router';
import {AlertComponent} from 'ng2-bootstrap/ng2-bootstrap';
import {Http} from '@angular/http';
import globals = require('../../../globals');
declare var jQuery: any;
import 'rxjs/Rx';

@Component({
	moduleId: module.id,
	selector: 'ua-my-annotations-student',
	templateUrl: 'ua-my-annotations-student.html',
  directives: [[AlertComponent, ROUTER_DIRECTIVES]]
})

export class MyAnnotationsStudentComponent {
  numInProgressAnnotations: number;
  numAnnotationSlots: number;
  costInPhenocashToAddAnnotationSlot: number;
  phenocashBalance: number;
  alerts: Array<Object> = [];
  constructor( private _router: Router, private _http: Http) {
    this.getMyAnnotations(true);
  }
  getMyAnnotations(initializeList: boolean) {
    let scope = this;
    let gotMyAnnotations = function (data: any) {
      if (initializeList) {
        // ngFor and ngRepeat do not work with DataTable!
        let tableBody = '';
        for (let i = 0; i < data.annotations.length; i++) {
          tableBody += '<tr style="cursor: pointer" onclick="localStorage.setItem(\'uaAnnotationTemp\',\'' +
            data.annotations[i].id + '\')"><td>';
          if (data.annotations[i].status === 1) {
            tableBody += '<i class="fa fa-pencil" aria-hidden="true" title="Draft (not yet published)"></i>';
          } else {
            tableBody += data.annotations[i].id;
          }
          tableBody += '</td><td>' +
            data.annotations[i].diseaseName + '</td><td>' + data.annotations[i].rewardInPoints +
            ' pts + ' + data.annotations[i].rewardInPhenocash + ' <i class="fa fa-money" aria-hidden="true"></i></td><td>' +
            data.annotations[i].date + '</td></tr>';
        }
        jQuery('#table-body-my-annotations').html(tableBody);
        jQuery('#table-my-annotations').DataTable({
          'order': [[ 3, 'desc' ]],
          'language': {
            'emptyTable': 'You have no annotations.<br />Note: annotations created for class exercises are not listed here.'
          }
        });
      }
      scope.numInProgressAnnotations = data.numInProgressAnnotations;
      scope.numAnnotationSlots = data.numAnnotationSlots;
      scope.costInPhenocashToAddAnnotationSlot = data.costInPhenocashToAddAnnotationSlot;
      scope.phenocashBalance = data.phenocashBalance;
    };
    let body = JSON.stringify({
      'token': localStorage.getItem('uaToken'),
      'classID': -1
    });
    this._http.post(globals.backendURL + '/restricted/annotations/student/list', body, globals.options)
      .map(res => res.json())
      .subscribe(
        data => gotMyAnnotations(data),
        err => console.log(err),
        () => console.log('Got my annotations')
      );
  }
  @HostListener('document:click') onMouseEnter() {
    if (localStorage.getItem('uaAnnotationTemp')) {
      let id = localStorage.getItem('uaAnnotationTemp');
      localStorage.removeItem('uaAnnotationTemp');
      this._router.navigate(['/dashboard', '/in-progress', id]);
    }
  }
  addAnnotationSlot() {
    let scope = this;
    if (!confirm('Are you sure you want to increase your number of annotation slots by one?'))
      return;
    this.alerts = [];
    let addedAnnotationSlot = function (data: any) {
      scope.alerts.push({
        type: 'success',
        msg: 'Thank you! Come again.',
        closable: true
      });
      scope.getMyAnnotations(false);
    };
    let body = JSON.stringify({
      'token': localStorage.getItem('uaToken'),
      'classID': -1
    });
    this._http.post(globals.backendURL + '/restricted/annotations/student/add-annotation-slot', body, globals.options)
      .map(res => res.json())
      .subscribe(
        data => addedAnnotationSlot(data),
        err => this.alerts.push({
          type: 'danger',
          msg: 'You don\'t have enough PhenoCash.',
          closable: true
        }),
        () => console.log('Add annotation slot')
      );
  }
}
