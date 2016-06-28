import {Component, OnInit} from '@angular/core';
import {Router, ROUTER_DIRECTIVES } from '@angular/router';
declare var jQuery: any;
import {AlertComponent} from 'ng2-bootstrap/ng2-bootstrap';
import {Http} from '@angular/http';
import globals = require('../../../globals');
import 'rxjs/Rx';

@Component({
  moduleId: module.id,
	selector: 'ua-my-annotations',
	templateUrl: 'ua-my-annotations.html',
  directives: [[AlertComponent, ROUTER_DIRECTIVES]]
})


export class MyAnnotationsComponent implements OnInit {
  diseaseSelected: boolean = false;
  newAnnotationDisease: string;
  typeAheadBox: string;
  alerts: Array<Object> = [];
  constructor( private _router: Router, private _http: Http) {
    let gotMyAnnotations = function (data: any) {
      // ngFor and ngRepeat do not work with DataTable!
      let tableBody = '';
      for (let i = 0; i < data.annotations.length; i++) {
        tableBody += '<tr id="d' + data.annotations[i].id + '"><td>';
        if (data.annotations[i].status === 1) {
          tableBody += '<i class="fa fa-pencil" aria-hidden="true" title="Draft (not yet published)"></i>';
        } else {
          tableBody += data.annotations[i].id;
        }
        tableBody += '</td><td>' +
          data.annotations[i].diseaseName + '</td><td>' + data.annotations[i].date + '</td></tr>';
        jQuery('#d' + data.annotations[i].id).click(function() {
          alert(data.annotations[i].id);
          this._router.navigate(['/dashboard', '/in-progress/' + data.annotations[i].id]);
        });
      }
      jQuery('#table-body').html(tableBody);
      jQuery('#table').DataTable({
        'language': {
          'emptyTable': 'Get started by creating or cloning an annotation!'
        }
      });
    };
    let body = JSON.stringify({
      'token': localStorage.getItem('uaToken')
    });
    this._http.post(globals.backendURL + '/restricted/annotations/prof/list', body, globals.options)
      .map(res => res.json())
      .subscribe(
        data => gotMyAnnotations(data),
        err => console.log(err),
        () => console.log('Got my annotations')
      );
  }
  ngOnInit():any {
    let scope = this;
    jQuery('.js-typeahead').typeahead({
      dynamic: true,
      cancelButton: false,
      source: {
        diseases: {
          ajax: {
            url: globals.backendURL + '/solr/omim/' + '{{query}}',
            path: 'matches'
          }
        }
      },
      callback: {
        onClickAfter: function (node: any, a: any, item: any, event: any) {
          scope.newAnnotationDisease = item.display;
          scope.selectDisease();
        }
      }
    });
  }
  selectDisease() {
    jQuery('.col-lg-8').attr('class', 'col-lg-5');
    jQuery('.col-lg-4').hide();
    this.diseaseSelected = true;
  }
  clearDisease() {
    jQuery('.col-lg-5').attr('class', 'col-lg-8');
    jQuery('.col-lg-4').show();
    this.diseaseSelected = false;
    this.typeAheadBox = '';
  }
  lookUpDisease() {
    window.open(globals.omimURL + this.newAnnotationDisease.replace(/[^0-9]/g, '').substr(0,
        this.newAnnotationDisease.indexOf(' ')), '_blank');
  }
  createAnnotation() {
    let scope = this;
    this.alerts = [];
    let diseaseName = this.newAnnotationDisease;
    let finishCreateAnnotation = function (data:any) {
      if (data.success) {
        scope._router.navigate(['/dashboard', '/in-progress/' + data.annotationID]);
      } else {
        scope.alerts.push({
          type: 'danger',
          msg: 'Invalid disease',
          closable: true
        });
        scope.newAnnotationDisease = diseaseName;
      }
    };
    if (this.newAnnotationDisease !== null) {
      this.newAnnotationDisease = '';
      // Create new annotation
      let body = JSON.stringify({
        'token': localStorage.getItem('uaToken'),
        'diseaseName': diseaseName,
        'vocabulary': 'omim' //ORPHA TODO
      });
      this._http.post(globals.backendURL + '/restricted/annotations/prof/new-annotation', body, globals.options)
        .map(res => res.json())
        .subscribe(
          data => finishCreateAnnotation(data),
          err => console.log(err),
          () => console.log('Created annotation')
        );
    }
  }
}
