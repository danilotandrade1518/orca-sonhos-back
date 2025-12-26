import { RouteDefinition } from '@http/server-adapter';
import { IPostgresConnectionAdapter } from '@infrastructure/adapters/IPostgresConnectionAdapter';

type UserSearchRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
};

export function buildUsersQueryRoutes(params: {
  connection: IPostgresConnectionAdapter;
}): RouteDefinition[] {
  return [
    {
      method: 'GET',
      path: '/users/search',
      controller: {
        handle: async (req) => {
          const rawQuery = (req.query?.query || '').trim();
          if (!rawQuery) {
            return { status: 200, body: [] };
          }

          const qLower = rawQuery.toLowerCase();
          const like = `%${qLower}%`;
          const phoneLike = `%${rawQuery}%`;

          const result = await params.connection.query<UserSearchRow>(
            `
              SELECT id, name, email, phone
              FROM users
              WHERE lower(email) LIKE $1
                 OR lower(name) LIKE $1
                 OR phone LIKE $2
              ORDER BY name ASC
              LIMIT 5
            `,
            [like, phoneLike],
          );

          return { status: 200, body: result?.rows ?? [] };
        },
      },
    },
  ];
}
