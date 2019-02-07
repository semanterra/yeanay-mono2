osv2-schema.json and schema.graphql are downloaded from the os graphql site by npm run get-schema.
This command is dependent on <root>/.graphqlconfig

osv2-schema.json is only used by tooling, such as the Intellij/Webstorm graphql editor.

schema.graphql is intended for use in detecting changes to the OpenStates schema;
just compare it with earlier version(s) in Git.  Consider updating src/types/gql-types.ts.


