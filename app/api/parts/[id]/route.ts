import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { partSchema } from "@/lib/validations";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const body = await request.json();
    const parsed = partSchema.partial().safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0].message },
        { status: 400 },
      );
    }

    const updatedPart = await prisma.part.update({
      where: { id: params.id },
      data: parsed.data,
    });

    return NextResponse.json(updatedPart);
  } catch (error) {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    await prisma.part.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ message: "Deleted successfully" });
  } catch (error) {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
