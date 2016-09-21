import {Component, OnInit} from '@angular/core';
import {Router, ROUTER_DIRECTIVES, RouteSegment} from '@angular/router';
declare var jQuery: any;
import {DROPDOWN_DIRECTIVES, TAB_DIRECTIVES, AlertComponent, MODAL_DIRECTVES, BS_VIEW_PROVIDERS} from 'ng2-bootstrap/ng2-bootstrap';
import {Http} from '@angular/http';
import globals = require('../../../globals');
import 'rxjs/Rx';
import {Dragula, DragulaService} from 'ng2-dragula/ng2-dragula';

@Component({
  moduleId: module.id,
	selector: 'ua-in-progress',
	templateUrl: 'ua-in-progress.html',
  directives: [[DROPDOWN_DIRECTIVES, TAB_DIRECTIVES, AlertComponent, ROUTER_DIRECTIVES, Dragula, MODAL_DIRECTVES]],
  viewProviders: [DragulaService, BS_VIEW_PROVIDERS]
})


export class InProgressComponent implements OnInit {
  alerts: Array<Object>;
  annotation: any = null;
  markUncitedPhenotypes: boolean = true;
  systemNames: Array<Object> = [];
  studentLevel: boolean = false;
  profLevel: boolean = false;
  loading: boolean = true;
  suggestedOnsets: Array<Object> = [];
  detailedPhenotype: any = null;
  startDiscussionMessage: string = '';
  routerOnActivate(curr: RouteSegment) {
    let scope = this;
    if (curr.getParam('id')) {
      localStorage.setItem('uaAnnotation', curr.getParam('id'));
      this.gotoAnnotation(parseInt(curr.getParam('id'), 10), 0, false);
    } else if (localStorage.getItem('uaAnnotation') === null) {
      this.alerts = [];
      this.alerts.push({
        type: 'danger',
        msg: 'You don\'t have any annotations open.',
        closable: true
      });
      return;
    } else {
      this.gotoAnnotation(localStorage.getItem('uaAnnotation'), 0, false);
    }
    let gotLevel = function (data: any) {
      if (data.level === 0) {
        scope.studentLevel = true;
        scope.profLevel = false;
      } else {
        scope.studentLevel = false;
        scope.profLevel = true;
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
  }
  jumpToAnnotation( annotationID: number ) {
    this._router.navigate(['/dashboard', '/in-progress', annotationID]);
  }
  constructor( private _router: Router, private _http: Http, private dragulaService: DragulaService) {
    let scope = this;
    dragulaService.setOptions('refs', {
      accepts: function (el: any, target: any, source: any, sibling: any) {
        return false;
      },
      invalid: function (el: any, handle: any) {
        return scope.annotation.status === 2 || scope.annotation.status === -2;
      },
      copy: true
    });
    dragulaService.drag.subscribe((value: any) => {
      jQuery('.ref').css('cursor', 'grabbing');
      jQuery('.hover-box').text('Let go of the mouse button over a phenotype (except Safari).');
      jQuery('.hover-box').show();
    });
    dragulaService.dragend.subscribe((value: any) => {
      jQuery('.ref').css('cursor', 'grab');
      jQuery('.hover-box').hide();
    });
    dragulaService.drop.subscribe((value: any) => {
      let elements = document.querySelectorAll(':hover');
      let element = elements[elements.length - 1];
      while (!element.id.startsWith('phenotype-') && element.parentElement)
        element = element.parentElement;
      if (!element.id.startsWith('phenotype-'))
        return;
      let scope = this;
      let number: number;
      for (let i = 0; i < scope.annotation.refs.length; i++) {
        if (String(scope.annotation.refs[i].refID) === value[1].id.match(/\d+/)[0]) {
          number = i + 1;
          break;
        }
      }
      for (let i = 0; i < scope.annotation.phenotypes.length; i++) {
        if (String(scope.annotation.phenotypes[i].phenotypeID) === element.id.match(/\d+/)[0]) {
          for (let j = 0; j < this.annotation.phenotypes[i].citations.length; j++) {
            if (this.annotation.phenotypes[i].citations[j].number === number)
              return;
          }
          scope.annotation.phenotypes[i].citations.push({refID: value[1].id.match(/\d+/)[0], number: number});
          scope.annotation.phenotypes[i].citations.sort(function(a: any, b: any) {
            return a.number - b.number;
          });
          scope.annotation.phenotypes[i].notOK = 0;
          break;
        }
      }
      let body = JSON.stringify({
        'token': localStorage.getItem('uaToken'),
        'annotationID': this.annotation.annotationID,
        'phenotypeID': element.id.match(/\d+/)[0],
        'refID': value[1].id.match(/\d+/)[0],
      });
      this._http.post(globals.backendURL + '/restricted/annotation/edit/citation/add', body, globals.options)
        .map(res => res.json())
        .subscribe(
          data => console.log(data),
          err => console.log(err),
          () => console.log('Finish add citation')
        );
    });
  }
  addCitation(phenotypeID: number) {
    let refNo = prompt('Reference number:');
    let number = parseInt(refNo, 10);
    if (!number || number > this.annotation.refs.length)
      return;
    for (let i = 0; i < this.annotation.phenotypes.length; i++) {
      if (this.annotation.phenotypes[i].phenotypeID === phenotypeID) {
        for (let j = 0; j < this.annotation.phenotypes[i].citations.length; j++) {
          if (this.annotation.phenotypes[i].citations[j].number === number)
            return;
        }
        this.annotation.phenotypes[i].citations.push({refID: this.annotation.refs[number - 1].refID, number: number});
        this.annotation.phenotypes[i].citations.sort(function(a: any, b: any) {
          return a.number - b.number;
        });
        this.annotation.phenotypes[i].notOK = 0;
        break;
      }
    }
    let body = JSON.stringify({
      'token': localStorage.getItem('uaToken'),
      'annotationID': this.annotation.annotationID,
      'phenotypeID': phenotypeID,
      'refID': this.annotation.refs[number - 1].refID,
    });
    this._http.post(globals.backendURL + '/restricted/annotation/edit/citation/add', body, globals.options)
      .map(res => res.json())
      .subscribe(
        data => console.log(data),
        err => console.log(err),
        () => console.log('Finish add citation')
      );
  }
  gotoAnnotation( annotationID: number, scrollPosition: number, checkNew: boolean ) {
    let scope = this;
    if (annotationID === null)
      return;
    this.alerts = [];
    if (!checkNew)
      this.systemNames = [];
    localStorage.setItem('uaAnnotation', '' + annotationID);
    jQuery('.add-bar').hide();
    let initializeAnnotation = function (data:any) {
      if (!checkNew) {
        scope.annotation = data;
      } else {
        scope.annotation.phenotypes.push(data.phenotypes[data.phenotypes.length - 1]);
      }
      if (data.status !== 2 && data.status !== -2) {
        jQuery('.add-bar').show();
      }
      // Look up phenotype names
      let loadedNames = function(data: any) {
        scope.loading = false;
        for (let x = 0; x < data.rows.length; x++) {
          let datum = data.rows[x];
          for (let i = 0; i < scope.annotation.phenotypes.length; i++) {
            if (scope.annotation.phenotypes[i].systemHPO === datum.id) {
              scope.annotation.phenotypes[i].systemName = datum.name;
              if (scope.systemNames.indexOf(datum.name) === -1) {
                scope.systemNames.push(datum.name);
                scope.systemNames.sort();
              }
            }
            if (scope.annotation.phenotypes[i].hpo === datum.id) {
              scope.annotation.phenotypes[i].phenotypeName = datum.name;
              scope.annotation.phenotypes[i].phenotypeDefinition = datum.def;
              let onsetHPO: string = null;
              let onsetName: string = null;
              for (let j = 0; j < datum.term_category.length; j++) {
                if (scope.onsetDescription(datum.term_category[j])) {
                  onsetHPO = datum.term_category[j];
                  onsetName = scope.onsetDescription(datum.term_category[j]);
                }
              }
              if (onsetHPO) {
                // If the phenotype is an onset, add it to suggested onsets
                scope.suggestedOnsets.push({
                  hpo: onsetHPO,
                  name: onsetName
                });
                scope.annotation.phenotypes.splice(i, 1);
              } else if (scope.onsetDescription(scope.annotation.phenotypes[i].hpo)) {
                // If the phenotype is an onset, add it to suggested onsets
                scope.suggestedOnsets.push({
                  hpo: scope.annotation.phenotypes[i].hpo,
                  name: scope.onsetDescription(scope.annotation.phenotypes[i].hpo)
                });
                scope.annotation.phenotypes.splice(i, 1);
              } else if (datum.term_category.indexOf('HP:0000118') === -1) {
                // If the phenotype is not an abnormality, we should remove it
                scope.annotation.phenotypes[i].display = false;
                scope.removePhenotype(scope.annotation.phenotypes[i].phenotypeID);
              }
            }
          }
        }
      };
      let loadedCitation = function(datum: any) {
        for (let i = 0; i < scope.annotation.phenotypes.length; i++) {
          if (String(scope.annotation.phenotypes[i].phenotypeID) === datum.phenotypeID) {
            scope.annotation.phenotypes[i].citations = datum.citations;
            for (let j = 0; j < scope.annotation.phenotypes[i].citations.length; j++) {
              for (let k = 0; k < scope.annotation.refs.length; k++) {
                if (scope.annotation.refs[k].refID === scope.annotation.phenotypes[i].citations[j].refID) {
                  scope.annotation.phenotypes[i].citations[j].number = k + 1;
                  break;
                }
              }
            }
            break;
          }
        }
      };
      let loadedSystem = function(datum: any) {
        // Add to list of systemNames
        if (scope.systemNames.indexOf(datum.systemName) === -1) {
          scope.systemNames.push(datum.systemName);
          scope.systemNames.sort();
        }
        for (let i = 0; i < data.phenotypes.length; i++) {
          if (data.phenotypes[i].phenotypeID === datum.phenotypeID) {
            data.phenotypes[i].systemName = datum.systemName;
          }
        }
      };
      let phenotypeNames: Array<string> = [];
      for (let i = 0; i < data.phenotypes.length; i++) {
        if (checkNew)
          i = data.phenotypes.length - 1;
        phenotypeNames.push(data.phenotypes[i].hpo);
        let body = JSON.stringify({
          'token': localStorage.getItem('uaToken'),
          'annotationID': data.annotationID,
          'phenotypeID': data.phenotypes[i].phenotypeID
        });
        scope._http.post(globals.backendURL + '/restricted/annotation/view/citation', body, globals.options)
          .map(res => res.json())
          .subscribe(
            data => loadedCitation(data),
            err => console.log(err),
            () => console.log('Got citation')
          );
        if (!data.phenotypes[i].systemHPO) {
          body = JSON.stringify({
            'token': localStorage.getItem('uaToken'),
            'annotationID': data.annotationID,
            'phenotypeID': data.phenotypes[i].phenotypeID
          });
          scope._http.post(globals.backendURL + '/restricted/annotation/system', body, globals.options)
            .map(res => res.json())
            .subscribe(
              data => loadedSystem(data),
              err => console.log(err),
              () => console.log('Got system')
            );
        } else if (phenotypeNames.indexOf(data.phenotypes[i].systemHPO) === -1) {
          phenotypeNames.push(data.phenotypes[i].systemHPO);
        }
      }
      let body = JSON.stringify({
        'phenotypeNames': phenotypeNames
      });
      scope._http.post(globals.backendURL + '/definitions', body, globals.options)
        .map(res => res.json())
        .subscribe(
          data => loadedNames(data),
          err => console.log(err),
          () => console.log('Got names')
        );
      // Look up refs
      let loadedRef = function(datum: any) {
        for (let i = 0; i < data.refs.length; i++) {
          if (String(data.refs[i].pmid) === datum.pmid) {
            data.refs[i].title = datum.title;
            data.refs[i].author = datum.author;
            data.refs[i].year = datum.year;
          }
        }
      };
      if (!checkNew) {
        for (let i = 0; i < data.refs.length; i++) {
          let body = JSON.stringify({
            'pmid': data.refs[i].pmid
          });
          scope._http.post(globals.backendURL + '/efetch', body, globals.options)
            .map(res => res.json())
            .subscribe(
              data => loadedRef(data),
              err => console.log(err),
              () => console.log('Got ref')
            );
        }
      }
      // Restore scroll position (after adding/removing phenotypes, and removing refs)
      // document.documentElement.scrollTop = document.body.scrollTop = scrollPosition;
    };
    let body = JSON.stringify({
      'token': localStorage.getItem('uaToken'),
      'annotationID': annotationID
    });
    this._http.post(globals.backendURL + '/restricted/annotation/view/full', body, globals.options)
      .map(res => res.json())
      .subscribe(
        data => initializeAnnotation(data),
        err => this.alerts.push({
          type: 'danger',
          msg: 'Invalid annotation',
          closable: true
        }),
        () => console.log('Got full annotation')
      );
  }
  ngOnInit():any {
    let scope = this;
    let display: string;
    jQuery('.js-typeahead').typeahead({
      dynamic: true,
      filter: false,
      source: {
        phenotypes: {
          ajax: {
            url: globals.backendURL + '/solr/hpo/' + '{{query}}',
            path: 'matches'
          }
        }
      },
      selector: {
        list: 'typeahead__list_annotator'
      },
      callback: {
        onClickAfter: function (node: any, a: any, item: any, event: any) {
          jQuery('.js-typeahead').val('');
          jQuery('.hover-box').hide();
          scope.alerts = [];
          let addedPhenotype = function() {
            scope.gotoAnnotation(scope.annotation.annotationID, document.documentElement.scrollTop || document.body.scrollTop, true);
          };
          let body = JSON.stringify({
            'token': localStorage.getItem('uaToken'),
            'annotationID': scope.annotation.annotationID,
            'phenotypeName': item.display
          });
          scope._http.post(globals.backendURL + '/restricted/annotation/edit/phenotype/add', body, globals.options)
            .map(res => res.json())
            .subscribe(
              data => addedPhenotype(),
              err => scope.alerts.push({
                type: 'danger',
                msg: 'Cannot add phenotype. Has it already been added?',
                closable: true
              }),
              () => console.log('Added phenotype')
            );
        },
        onMouseEnter: function (node: any, a: any, item: any, event: any) {
          jQuery('.hover-box').text('Loading definition…');
          jQuery('.hover-box').show();
          let loadedDefinition = function(data: any) {
            if (data.name === display && scope.studentLevel) {
              jQuery('.hover-box').html(data.def);
            } else if (data.name === display) {
              jQuery('.hover-box').html('<strong>' + data.id + '</strong><br />' + data.def);
            }
          };
          let body = JSON.stringify({
            'phenotypeName': item.display
          });
          display = item.display;
          scope._http.post(globals.backendURL + '/definition', body, globals.options)
            .map(res => res.json())
            .subscribe(
              data => loadedDefinition(data),
              err => console.log(err),
              () => console.log('Got definition')
            );
        },
        onMouseLeave: function (node: any, a: any, item: any, event: any) {
          jQuery('.hover-box').hide();
        }
      }
    });
    jQuery('.js-typeahead-ref').typeahead({
      dynamic: true,
      filter: false,
      maxItem: 5,
      source: {
        phenotypes: {
          ajax: {
            url: globals.backendURL + '/entrez/' + '{{query}}',
            path: 'matches'
          }
        }
      },
      selector: {
        list: 'typeahead__list_annotator'
      },
      callback: {
        onClickAfter: function (node: any, a: any, item: any, event: any) {
          jQuery('.js-typeahead-ref').val('');
          jQuery('.hover-box').hide();
          scope.alerts = [];
          let addedRef = function(data: any) {
            scope.annotation.refs.push({
              refID: data.refID,
              pmid: data.pmid,
              title: data.title,
              author: data.author,
              year: data.year
            });
          };
          let body = JSON.stringify({
            'token': localStorage.getItem('uaToken'),
            'annotationID': scope.annotation.annotationID,
            'pmid': item.display.substr(0, item.display.indexOf(' '))
          });
          scope._http.post(globals.backendURL + '/restricted/annotation/edit/ref/add', body, globals.options)
            .map(res => res.json())
            .subscribe(
              data => addedRef(data),
              err => scope.alerts.push({
                type: 'danger',
                msg: 'Cannot add reference. Has it already been added?',
                closable: true
              }),
              () => console.log('Added ref')
            );
        },
        onMouseEnter: function (node: any, a: any, item: any, event: any) {
          jQuery('.hover-box').text('Loading metadata…');
          jQuery('.hover-box').show();
          let loadedMetadata = function(data: any) {
            if (data.pmid === display) {
              jQuery('.hover-box').html('<strong>' + data.author + ' (' + data.year + ')</strong><br />' + data.title);
            }
          };
          let body = JSON.stringify({
            'pmid': item.display.substr(0, item.display.indexOf(' '))
          });
          display = item.display.substr(0, item.display.indexOf(' '));
          scope._http.post(globals.backendURL + '/efetch', body, globals.options)
            .map(res => res.json())
            .subscribe(
              data => loadedMetadata(data),
              err => console.log(err),
              () => console.log('Got metadata')
            );
        },
        onMouseLeave: function (node: any, a: any, item: any, event: any) {
          jQuery('.hover-box').hide();
        }
      }
    });
    jQuery('.add-bar').hide();
    jQuery(document).on('mousemove', function(e: any){
      jQuery('.hover-box').css({
        left:   e.clientX - 320,
        bottom: window.innerHeight - e.clientY
      });
    });
  }
  setObserved(phenotypeID: number, observed: boolean) {
    let scope = this;
    for (let i = 0; i < scope.annotation.phenotypes.length; i++) {
      if (scope.annotation.phenotypes[i].phenotypeID === phenotypeID) {
        scope.annotation.phenotypes[i].observed = observed;
        scope.annotation.phenotypes[i].notOK = 0;
      }
    }
    let finishSetObserved = function(data: any) {
      for (let i = 0; i < scope.annotation.phenotypes.length; i++) {
        if (scope.annotation.phenotypes[i].phenotypeID === data.phenotypeID) {
          scope.annotation.phenotypes[i].observed = data.observed;
          scope.annotation.phenotypes[i].notOK = 0;
        }
      }
    };
    let body = JSON.stringify({
      'token': localStorage.getItem('uaToken'),
      'annotationID': this.annotation.annotationID,
      'phenotypeID': phenotypeID,
      'observed': observed
    });
    this._http.post(globals.backendURL + '/restricted/annotation/edit/phenotype/observed', body, globals.options)
      .map(res => res.json())
      .subscribe(
        data => finishSetObserved(data),
        err => console.log(err),
        () => console.log('Finish set observed')
      );
  }
  setFrequency(phenotypeID: number, frequency: number) {
    let scope = this;
    let finishSetObserved = function(data: any) {
      for (let i = 0; i < scope.annotation.phenotypes.length; i++) {
        if (scope.annotation.phenotypes[i].phenotypeID === data.phenotypeID) {
          scope.annotation.phenotypes[i].frequency = data.frequency;
          scope.annotation.phenotypes[i].notOK = 0;
        }
      }
    };
    let body = JSON.stringify({
      'token': localStorage.getItem('uaToken'),
      'annotationID': this.annotation.annotationID,
      'phenotypeID': phenotypeID,
      'frequency': frequency
    });
    this._http.post(globals.backendURL + '/restricted/annotation/edit/phenotype/frequency', body, globals.options)
      .map(res => res.json())
      .subscribe(
        data => finishSetObserved(data),
        err => console.log(err),
        () => console.log('Finish set frequency')
      );
  }
  setOnset(phenotypeID: number, onset: string) {
    let scope = this;
    let finishSetOnset = function(data: any) {
      for (let i = 0; i < scope.annotation.phenotypes.length; i++) {
        if (scope.annotation.phenotypes[i].phenotypeID === data.phenotypeID) {
          scope.annotation.phenotypes[i].onset = data.onset;
          scope.annotation.phenotypes[i].notOK = 0;
        }
      }
    };
    let body = JSON.stringify({
      'token': localStorage.getItem('uaToken'),
      'annotationID': this.annotation.annotationID,
      'phenotypeID': phenotypeID,
      'onset': onset,
      'setOK': true
    });
    this._http.post(globals.backendURL + '/restricted/annotation/edit/phenotype/onset', body, globals.options)
      .map(res => res.json())
      .subscribe(
        data => finishSetOnset(data),
        err => console.log(err),
        () => console.log('Finish set onset')
      );
  }
  removePhenotype(phenotypeID: number) {
    let scope = this;
    let finishRemovePhenotype = function(data: any) {
      for (let i = 0; i < scope.annotation.phenotypes.length; i++) {
        if (scope.annotation.phenotypes[i].phenotypeID === phenotypeID) {
          let systemName = scope.annotation.phenotypes[i].systemName;
          scope.annotation.phenotypes.splice(i, 1);
          let found: boolean = false;
          for (let j = 0; j < scope.annotation.phenotypes.length; j++) {
            if (scope.annotation.phenotypes[j].systemName === systemName) {
              found = true;
              break;
            }
          }
          if (!found) {
            for (let j = 0; j < scope.systemNames.length; j++) {
              if (scope.systemNames[j] === systemName)
                scope.systemNames.splice(j, 1);
            }
          }
        }
      }
    };
    let body = JSON.stringify({
      'token': localStorage.getItem('uaToken'),
      'annotationID': this.annotation.annotationID,
      'phenotypeID': phenotypeID,
    });
    this._http.post(globals.backendURL + '/restricted/annotation/edit/phenotype/remove', body, globals.options)
      .map(res => res.json())
      .subscribe(
        data => finishRemovePhenotype(data),
        err => console.log(err),
        () => console.log('Finish remove phenotype')
      );
  }
  removeRef(refID: number) {
    let scope = this;
    let finishRemoveRef = function(data: any) {
      scope.gotoAnnotation(localStorage.getItem('uaAnnotation'), document.documentElement.scrollTop || document.body.scrollTop, false);
    };
    let body = JSON.stringify({
      'token': localStorage.getItem('uaToken'),
      'annotationID': this.annotation.annotationID,
      'refID': refID,
    });
    this._http.post(globals.backendURL + '/restricted/annotation/edit/ref/remove', body, globals.options)
      .map(res => res.json())
      .subscribe(
        data => finishRemoveRef(data),
        err => console.log(err),
        () => console.log('Finish remove ref')
      );
  }
  removeCitation(phenotypeID: number, refID: number) {
    let scope = this;
    for (let i = 0; i < scope.annotation.phenotypes.length; i++) {
      if (scope.annotation.phenotypes[i].phenotypeID === phenotypeID) {
        for (let j = 0; j < scope.annotation.phenotypes[i].citations.length; j++) {
          if (scope.annotation.phenotypes[i].citations[j].refID === refID)
            scope.annotation.phenotypes[i].citations.splice(j, 1);
        }
      }
    }
    let body = JSON.stringify({
      'token': localStorage.getItem('uaToken'),
      'annotationID': this.annotation.annotationID,
      'phenotypeID': phenotypeID,
      'refID': refID,
    });
    this._http.post(globals.backendURL + '/restricted/annotation/edit/citation/remove', body, globals.options)
      .map(res => res.json())
      .subscribe(
        data => console.log(data),
        err => console.log(err),
        () => console.log('Finish remove citation')
      );
  }
  gotoPhenository(diseaseDB: string, diseaseName: string) {
    localStorage.setItem('uaPhenositoryDisease', diseaseName);
    localStorage.setItem('uaPhenositoryDiseaseDB', diseaseDB);
    this._router.navigate(['/dashboard', '/phenository']);
  }
  lookUpDisease(diseaseName: string) {
    window.open(globals.omimURL + diseaseName.substr(0, diseaseName.indexOf(' ')).replace(/[^0-9]/g, ''), '_blank');
  }
  copyToClipboard(string: string) {
    window.prompt('Copy to clipboard: Ctrl+C or Cmd+C', string);
  }
  deleteAnnotation() {
    if (!confirm('Deleting an annotation cannot be undone!'))
      return;
    let scope = this;
    let finishDelete = function (data: any) {
      localStorage.removeItem('uaAnnotation');
      scope._router.navigate(['/dashboard', '/home']);
    };
    let body = JSON.stringify({
      'token': localStorage.getItem('uaToken'),
      'annotationID': this.annotation.annotationID
    });
    this._http.post(globals.backendURL + '/restricted/annotation/edit/delete', body, globals.options)
      .map(res => res.json())
      .subscribe(
        data => finishDelete(data),
        err => console.log(err),
        () => console.log('Deleted')
      );
  }
  publishAnnotation() {
    let scope = this;
    this.alerts = [];
    // Check if all OKs have been cleared
    for (let i = 0; i < this.annotation.phenotypes.length; i++) {
      if (this.annotation.phenotypes[i].notOK === 1) {
        if (this.annotation.cloneOf === null) {
          this.alerts.push({
            type: 'danger',
            msg: 'Please confirm that all imported phenotypes are correct (look for the blue "OK?" labels).',
            closable: true
          });
        } else {
          this.alerts.push({
            type: 'danger',
            msg: 'Please confirm that all cloned phenotypes are correct (look for the blue "OK?" labels).',
            closable: true
          });
        }
        return;
      }
    }
    if (!confirm('Publish this annotation to the Phenository? You will not be able to change it afterwards.'))
      return;
    let finishPublish = function (data: any) {
      if (data.success) {
        scope.gotoAnnotation(scope.annotation.annotationID,
          document.documentElement.scrollTop || document.body.scrollTop, false);
        scope.loading = true;
        scope.alerts.push({
          type: 'success',
          msg: 'Annotation published! By publishing this annotation, you recommend it for this disease.',
          closable: true
        });
      } else if (data.exactDuplicate) {
        scope.alerts.push({
          type: 'danger',
          msg: 'This annotation is exactly the same as annotation ' + data.exactDuplicate + '.',
          closable: true
        });
      } else if (data.uncitedPhenotypes) {
        scope.markUncitedPhenotypes = true;
        scope.alerts.push({
          type: 'danger',
          msg: 'Please cite the phenotypes marked with (!).',
          closable: true
        });
      } else if (data.refs.length > 0) {
        scope.alerts.push({
          type: 'danger',
          msg: 'Please assign or remove unused reference(s): ' + data.refs.toString(),
          closable: true
        });
      } else {
        scope.alerts.push({
          type: 'danger',
          msg: 'You must have added at least one phenotype.',
          closable: true
        });
      }
    };
    let body = JSON.stringify({
      'token': localStorage.getItem('uaToken'),
      'annotationID': this.annotation.annotationID
    });
    this._http.post(globals.backendURL + '/restricted/annotation/edit/prof/publish', body, globals.options)
      .map(res => res.json())
      .subscribe(
        data => finishPublish(data),
        err => console.log(err),
        () => console.log('Published (or not)')
      );
  }
  likeAnnotation(like: boolean) {
    let scope = this;
    let finishLike = function(data: any) {
      if (data.success) {
        if (like) {
          scope.annotation.likes++;
        } else {
          scope.annotation.likes--;
        }
        scope.annotation.liked = like;
      } else {
        scope.alerts.push({
          type: 'danger',
          msg: 'You must recommend exactly one annotation for a disease that you have previously annotated.',
          closable: true
        });
      }
    };
    let body = JSON.stringify({
      'token': localStorage.getItem('uaToken'),
      'annotationID': this.annotation.annotationID,
      'like': like
    });
    this._http.post(globals.backendURL + '/restricted/annotation/prof/like', body, globals.options)
      .map(res => res.json())
      .subscribe(
        data => finishLike(data),
        err => console.log(err),
        () => console.log('Like/dislike complete')
      );
  }
  cloneAnnotation() {
    let scope = this;
    let finishClone = function(data: any) {
      scope.jumpToAnnotation(data.annotationID);
    };
    let body = JSON.stringify({
      'token': localStorage.getItem('uaToken'),
      'annotationID': this.annotation.annotationID,
    });
    this._http.post(globals.backendURL + '/restricted/annotation/prof/clone', body, globals.options)
      .map(res => res.json())
      .subscribe(
        data => finishClone(data),
        err => console.log(err),
        () => console.log('Cloned')
      );
  }
  submitExercise(exerciseID: number) {
    this._router.navigate(['/dashboard', '/submit', exerciseID]);
  }
  applyOnset(hpo: string) {
    let scope = this;
    let finishApplyOnset = function(data: any) {
      for (let i = 0; i < scope.annotation.phenotypes.length; i++) {
        if (scope.annotation.phenotypes[i].phenotypeID === data.phenotypeID) {
          scope.annotation.phenotypes[i].onset = data.onset;
        }
      }
    };
    for (let i = 0; i < this.annotation.phenotypes.length; i++) {
      let body = JSON.stringify({
        'token': localStorage.getItem('uaToken'),
        'annotationID': this.annotation.annotationID,
        'phenotypeID': this.annotation.phenotypes[i].phenotypeID,
        'onset': hpo,
        'setOK': false
      });
      this._http.post(globals.backendURL + '/restricted/annotation/edit/phenotype/onset', body, globals.options)
        .map(res => res.json())
        .subscribe(
          data => finishApplyOnset(data),
          err => console.log(err),
          () => console.log('Finish apply onset')
        );
    }
  }
  openDetails(phenotype: any) {
    this.detailedPhenotype = phenotype;
  }
  setDetail(detail: string, value: string) {
    let scope = this;
    let finishSetDetail = function(data: any) {
      for (let i = 0; i < scope.annotation.phenotypes.length; i++) {
        if (scope.annotation.phenotypes[i].phenotypeID === scope.detailedPhenotype.phenotypeID) {
          scope.annotation.phenotypes[i] = scope.detailedPhenotype;
          scope.annotation.phenotypes[i].notOK = 0;
        }
      }
    };
    let body = JSON.stringify({
      'token': localStorage.getItem('uaToken'),
      'annotationID': this.annotation.annotationID,
      'phenotypeID': this.detailedPhenotype.phenotypeID,
      'detail': detail,
      'value': value
    });
    this._http.post(globals.backendURL + '/restricted/annotation/edit/phenotype/detail', body, globals.options)
      .map(res => res.json())
      .subscribe(
        data => finishSetDetail(data),
        err => console.log(err),
        () => console.log('Finish set detail')
      );
  }
  gotoDiscussion(communityTopicID: number) {
    window.open('http://community.phenotate.org/topic/' + communityTopicID);
  }
  startDiscussion() {
    let scope = this;
    let finishStartDiscussion = function(data: any) {
      scope.annotation.communityTopicID = data.communityTopicID;
      scope.gotoDiscussion(data.communityTopicID);
    };
    this.alerts = [];
    let body = JSON.stringify({
      'token': localStorage.getItem('uaToken'),
      'annotationID': this.annotation.annotationID,
      'message': this.startDiscussionMessage
    });
    this._http.post(globals.backendURL + '/restricted/annotation/prof/discuss', body, globals.options)
      .map(res => res.json())
      .subscribe(
        data => finishStartDiscussion(data),
        err => this.alerts.push({
          type: 'danger',
          msg: 'Cannot post message. Perhaps it\'s too short or too long.',
          closable: true
        }),
        () => console.log('Discussion started')
      );
  }
  closeAnnotation() {
    localStorage.removeItem('uaAnnotation');
    if (this.profLevel) {
      this._router.navigate(['/dashboard', '/class-prof', this.annotation.classID]);
    } else {
      this._router.navigate(['/dashboard', '/class-student', this.annotation.classID]);
    }
  }
  onsetAbbreviation(hpo: string) {
    switch (hpo) {
      case 'HP:0030674':
        return 'ANT';
      case 'HP:0003577':
        return 'CON';
      case 'HP:0003623':
        return 'NEO';
      case 'HP:0003593':
        return 'INF';
      case 'HP:0011463':
        return 'CHI';
      case 'HP:0003621':
        return 'JUV';
      case 'HP:0003581':
        return 'ADU';
      case '-1':
        return '–––';
      default:
        return null;
    }
  }
  onsetDescription(hpo: string) {
    switch (hpo) {
      case 'HP:0030674':
        return 'Antenatal (before birth)';
      case 'HP:0003577':
        return 'Congenital (at birth)';
      case 'HP:0003623':
        return 'Neonatal (0 to 28 days)';
      case 'HP:0003593':
        return 'Infantile (28 days to 1 year)';
      case 'HP:0011463':
        return 'Childhood (1 to 5 years)';
      case 'HP:0003621':
        return 'Juvenile (5 to 15 years)';
      case 'HP:0003581':
        return 'Adult (16 years or later)';
      case '-1':
        return 'Not sure';
      default:
        return null;
    }
  }
  frequencyDescription(frequency: number) {
    switch (frequency) {
      case -1:
        return 'Not sure';
      case 0:
        return 'Variable (prob. 30% to 70%)';
      case 0.01:
        return 'Very rare (1%)';
      case 0.05:
        return 'Rare (5%)';
      case 0.075:
        return 'Occasional (7.5%)';
      case 0.33:
        return 'Frequent (33%)';
      case 0.5:
        return 'Typical (50%)';
      case 0.75:
        return 'Common (75%)';
      case 0.9:
        return 'Hallmark (90%)';
      case 1:
        return 'Obligate (100%)';
      default:
        return 'Not sure';
    }
  }
}
