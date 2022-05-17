import type { Post } from "@prisma/client";
import type { ActionFunction } from "@remix-run/node";
import { json, LoaderFunction, redirect } from "@remix-run/node";
import { Form, useActionData, useLoaderData, useTransition } from "@remix-run/react";
import invariant from "tiny-invariant";
import { editPost, getPost } from "~/models/post.server";
type ActionData =
  | {
      title: null | string;
      slug: null | string;
      markdown: null | string;
    }
  | undefined;


type LoaderData = { post: Post };

export const loader: LoaderFunction = async ({
  params,
}) => {
  invariant(params.slug, `params.slug is required`);
  const post = await getPost(params.slug);
  invariant(post, `Post not found: ${params.slug}`);
  //console.log("RAN LOADER", post);
  return json<LoaderData>({ post });
};


export const action:ActionFunction = async ({ request }) => {
  await new Promise(resolve => setTimeout(resolve, 2000));
  const formData = await request.formData();

  const title = formData.get("title");
  const slug = formData.get("slug");
  const markdown = formData.get("markdown");

  const errors: ActionData = {
    title: title ? null : "Title is required",
    slug: slug ? null : "Slug is required",
    markdown: markdown ? null : "Markdown is required",
  };

  const hasErrors = Object.values(errors).some(
    (errorMessage) => errorMessage
  );

  if (hasErrors) {
    return json<ActionData>(errors);
  }

  invariant(
    typeof title === "string",
    "title must be a string"
  );
  invariant(
    typeof slug === "string",
    "slug must be a string"
  );
  invariant(
    typeof markdown === "string",
    "markdown must be a string"
  );
  console.log("*** about to edit", title, slug, markdown);
  await editPost({ title, slug, markdown });

  return redirect("/posts/admin");
};

const inputClassName = `w-full rounded border border-gray-500 px-2 py-1 text-lg`;

export default function EditPost() {
    const { post } = useLoaderData() as LoaderData;
    //console.info("*** editPost render", post);
    const transition = useTransition();
    const isEditing = Boolean(transition.submission);
    const errors = useActionData();

  return (
    <>
    <h2 className="my-6 mb-6 border-b-2 text-center text-2xl">Editing: {post.slug}</h2>
    <Form method="post">
     <p>
        <input name="slug" type="hidden" value={post.slug} />
     </p>
      <p>
        <label>
          Post Title:{" "}
          {errors?.title ? (
            <em className="text-red-600">{errors.title}</em>
          ) : null}
          <input
            type="text"
            name="title"
            className={inputClassName}
            defaultValue={post.title}
          />
        </label>
      </p>
      <p>
        <label htmlFor="markdown">Markdown:</label>
        {errors?.markdown ? (
            <em className="text-red-600">
              {errors.markdown}
            </em>
          ) : null}
        <br />
        <textarea
          id="markdown"
          rows={20}
          name="markdown"
          defaultValue={post.markdown}
          className={`${inputClassName} font-mono`}
        />
      </p>
      <p className="text-right">
        <button
          type="submit"
          disabled={isEditing}
          className="rounded bg-blue-500 py-2 px-4 text-white hover:bg-blue-600 focus:bg-blue-400 disabled:bg-blue-300"
        >
          {isEditing ? "Editing..." : "Edit Post"}
        </button>
      </p>
    </Form>
    </>
  );
}
