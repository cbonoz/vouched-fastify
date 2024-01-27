begin;

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS citext;


CREATE TABLE users
(
    id            UUID        DEFAULT gen_random_uuid() NOT NULL,
    external_id   text        unique NOT NULL,
    created_at    TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at    TIMESTAMPTZ DEFAULT now() NOT NULL,
    deleted_at    TIMESTAMPTZ,
    activated_at  TIMESTAMPTZ,
    handle       citext UNIQUE,
    email         citext UNIQUE,
    PRIMARY KEY (id)
);

CREATE TABLE endorsements(
    id            UUID        DEFAULT gen_random_uuid() NOT NULL,
    created_at    TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at    TIMESTAMPTZ DEFAULT now() NOT NULL,
    deleted_at    TIMESTAMPTZ,
    message text NOT NULL,
    user_name text NOT NULL,
    user_id       UUID        NOT NULL,
    endorser_id   UUID        NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (endorser_id) REFERENCES users (id)
);


create unique index user_emails on users (email);
create unique index user_handles on users (handle);
create unique index user_external_ids on users (external_id);
create unique index endorsement_user_id_endorser_id on endorsements (user_id, endorser_id);
create index endorsement_user_id on endorsements(user_id);
create index endorsement_endorser_id on endorsements(endorser_id);

end;
