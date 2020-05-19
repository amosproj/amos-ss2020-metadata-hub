package GraphQL;

import Database.DatabaseProvider;
import com.google.common.base.Charsets;
import com.google.common.io.Resources;
import graphql.GraphQL;
import graphql.schema.GraphQLSchema;
import graphql.schema.idl.RuntimeWiring;
import graphql.schema.idl.SchemaGenerator;
import graphql.schema.idl.SchemaParser;
import graphql.schema.idl.TypeDefinitionRegistry;
import lombok.Getter;
import lombok.RequiredArgsConstructor;


import java.io.IOException;
import java.net.URL;

import static graphql.schema.idl.TypeRuntimeWiring.newTypeWiring;


@RequiredArgsConstructor
public class GraphQLProvider
{
    private final GraphQLDataFetchers graphQLDataFetchers;
    private final DatabaseProvider databaseProvider;
    @Getter private GraphQL graphQL;

    public GraphQLProvider init() throws IOException
    {
        URL url = Resources.getResource("schema.graphqls");
        String sdl = Resources.toString(url, Charsets.UTF_8);
        GraphQLSchema graphQLSchema = buildSchema(sdl);
        this.graphQL = GraphQL.newGraphQL(graphQLSchema).build();
        return this;
    }

    private GraphQLSchema buildSchema(String sdl)
    {
        TypeDefinitionRegistry typeRegistry = new SchemaParser().parse(sdl);
        RuntimeWiring runtimeWiring = buildWiring();
        SchemaGenerator schemaGenerator = new SchemaGenerator();
        return schemaGenerator.makeExecutableSchema(typeRegistry, runtimeWiring);
    }

    private RuntimeWiring buildWiring()
    {
        return RuntimeWiring.newRuntimeWiring()
            .type(newTypeWiring("Query")
                .dataFetcher("teststuff", graphQLDataFetchers.getDatabaseTestFetcher()))
            .type(newTypeWiring("Query")
                .dataFetcher("get_metadata", graphQLDataFetchers.getFileMetadataFetcher()))
            .type(newTypeWiring("Query")
                .dataFetcher("get_dir_metadata", graphQLDataFetchers.getDirMetadataFetcher()))

            .build();
    }
}
