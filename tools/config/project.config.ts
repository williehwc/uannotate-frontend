import { join } from 'path';

import { SeedConfig } from './seed.config';
import { InjectableDependency } from './seed.config.interfaces';

/**
 * This class extends the basic seed configuration, allowing for project specific overrides. A few examples can be found
 * below.
 */
export class ProjectConfig extends SeedConfig {

  PROJECT_TASKS_DIR = join(process.cwd(), this.TOOLS_DIR, 'tasks', 'project');
  FONTS_DEST = `${this.APP_DEST}/fonts`;
  FONTS_SRC = [
    'node_modules/font-awesome/fonts/**'
  ];

  constructor() {
    super();
    this.APP_TITLE = 'Phenotate';
    let additional_deps: InjectableDependency[] = [
      { src: 'font-awesome/css/font-awesome.css', inject: true},
      { src: 'jquery/dist/jquery.js', inject: 'libs' },
      { src: 'highcharts/highcharts.js', inject: 'libs' },
      { src: 'highcharts/modules/exporting.js', inject: 'libs' },
      { src: 'jquery-typeahead/dist/jquery.typeahead.min.js', inject: 'libs' },
      { src: 'jquery-typeahead/dist/jquery.typeahead.min.css', inject: true},
      { src: 'datatables.net/js/jquery.dataTables.js', inject: 'libs' },
      { src: 'datatables.net-dt/css/jquery.dataTables.css', inject: true}
    ];

    const seedDependencies = this.NPM_DEPENDENCIES;

    this.NPM_DEPENDENCIES = seedDependencies.concat(additional_deps);

    /* Add to or override NPM module configurations: */
    //this.mergeObject( this.PLUGIN_CONFIGS['browser-sync'], { ghostMode: false } );

  }
}
