import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const RUTAS_PROTEGIDAS: { prefix: string; rol: "alumno" | "profesor" | "admin" }[] = [
  { prefix: "/alumno", rol: "alumno" },
  { prefix: "/profesor", rol: "profesor" },
  { prefix: "/admin", rol: "admin" },
];

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const rutaProtegida = RUTAS_PROTEGIDAS.find((r) =>
    request.nextUrl.pathname.startsWith(r.prefix),
  );

  if (rutaProtegida) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", request.nextUrl.pathname);
      return NextResponse.redirect(url);
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("rol")
      .eq("id", user.id)
      .single();

    if (profile?.rol !== rutaProtegida.rol) {
      const url = request.nextUrl.clone();
      url.pathname = profile?.rol ? `/${profile.rol}` : "/login";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
