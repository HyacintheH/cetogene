// 'use strict';
//
// module.exports = function(app, callback) {
//   // Obtain the datasource registered with the name "db"
//   const dataSource = app.dataSources.cetogene;
//   // Step 1: define a model for "INVENTORY" table,
//   // including any models for related tables (e.g. "PRODUCT").
//   this.discoverModelsAtRuntime = function(table) {
//     dataSource.discoverAndBuildModels(
//       table,
//       {relations: true},
//       function(err, models) {
//         if (err) return callback(err);
//
//         // Step 2: expose all new models via REST API
//         for (const modelName in models) {
//           app.model(models[modelName], {dataSource: dataSource});
//         }
//       });
//   };
//
//   this.discoverModelsAtRuntime('customer');
//   this.discoverModelsAtRuntime('aliment');
//   this.discoverModelsAtRuntime('repas');
//   this.discoverModelsAtRuntime('element_repas');
//   this.discoverModelsAtRuntime('regime');
//
//   callback();
// };

'use strict';

const loopback = require('loopback');
const promisify = require('util').promisify;
const fs = require('fs');
const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const mkdirp = promisify(require('mkdirp'));

const DATASOURCE_NAME = 'cetogene';
const dataSourceConfig = require('./server/datasources.json');
const db = new loopback.DataSource(dataSourceConfig[DATASOURCE_NAME]);

discover().then(
  success => process.exit(),
  error => { console.error('UNHANDLED ERROR:\n', error); process.exit(1); }
);

async function discover() {
  // It's important to pass the same "options" object to all calls
  // of dataSource.discoverSchemas(), it allows the method to cache
  // discovered related models
  const options = {relations: true};

  // Discover models and relations
  const customerSchemas = await db.discoverSchemas('customer', options);
  const alimentSchemas = await db.discoverSchemas('aliment', options);
  const repasSchemas = await db.discoverSchemas('repas', options);
  const elementRepasSchemas = await db.discoverSchemas('element_repas', options);
  const regimeSchemas = await db.discoverSchemas('regime', options);


  // Create model definition files
  await mkdirp('common/models');
  await writeFile(
    'common/models/customer.json',
    JSON.stringify(customerSchemas['public.customer'], null, 2)
  );
  await writeFile(
    'common/models/aliment.json',
    JSON.stringify(alimentSchemas['public.aliment'], null, 2)
  );
  await writeFile(
    'common/models/repas.json',
    JSON.stringify(repasSchemas['public.repas'], null, 2)
  );
  await writeFile(
    'common/models/element-repas.json',
    JSON.stringify(elementRepasSchemas['public.element_repas'], null, 2)
  );
  await writeFile(
    'common/models/regime.json',
    JSON.stringify(regimeSchemas['public.regime'], null, 2)
  );

  // Expose models via REST API
  const configJson = await readFile('server/model-config.json', 'utf-8');
  console.log('MODEL CONFIG', configJson);
  const config = JSON.parse(configJson);
  config.Customer = {dataSource: DATASOURCE_NAME, public: false};
  config.Aliment = {dataSource: DATASOURCE_NAME, public: false};
  config.Repas = {dataSource: DATASOURCE_NAME, public: false};
  config.ElementRepas = {dataSource: DATASOURCE_NAME, public: false};
  config.Regime = {dataSource: DATASOURCE_NAME, public: false};
  await writeFile(
    'server/model-config.json',
    JSON.stringify(config, null, 2)
  );
}
