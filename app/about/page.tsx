import Image from "next/image"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Target, Zap } from "lucide-react"
import { getTeachers } from "@/lib/data/get-teachers"
import Link from "next/link"

export default async function AboutPage() {
  const teachers = await getTeachers()

  return (
    <div className="bg-background text-foreground">
      <main>
        {/* Hero Section */}
        <section className="relative py-24 md:py-32 overflow-hidden">
          <Image
            src="/aboutus.png"
            alt="About Us Background"
            layout="fill"
            objectFit="cover"
            quality={100}
            className="absolute inset-0 z-0 opacity-30"
          />
          <div className="relative z-10 container mx-auto px-4 text-center text-foreground">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-balance leading-[1.1] mb-6">
              Empowering the Next Generation of Tech Leaders
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
              NexusAcademy is on a mission to make high-quality tech education accessible to everyone in Bangladesh,
              fostering a community of skilled professionals ready to shape the future.
            </p>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="py-24">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-6">Our Mission</h2>
                <p className="text-muted-foreground text-lg mb-6">
                  To bridge the skill gap in the tech industry by providing world-class, affordable, and practical
                  education. We believe in learning by doing, and our courses are designed to equip students with the
                  real-world skills they need to succeed.
                </p>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Target className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg">Practical, Project-Based Learning</h4>
                      <p className="text-muted-foreground">
                        Master skills with hands-on projects that mirror real-world challenges.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Zap className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg">Expert-Led Instruction</h4>
                      <p className="text-muted-foreground">
                        Learn from industry veterans who are passionate about sharing their knowledge.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <Card className="bg-primary/10 border-primary/20 p-8">
                <CardTitle className="text-3xl md:text-4xl font-bold mb-6">Our Vision</CardTitle>
                <CardContent className="p-0 text-muted-foreground text-lg">
                  To become the leading force for digital transformation in Bangladesh, creating a vibrant ecosystem of
                  innovation, talent, and opportunity that is recognized on a global scale.
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-24 bg-secondary/50">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Meet Our Instructors</h2>
              <p className="text-muted-foreground text-lg">
                Our instructors are industry experts dedicated to your success.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
              {teachers.map((teacher) => (
                <Link href={`/mentors/${teacher.id}`} key={teacher.id}>
                  <Card
                    className="text-center bg-gradient-to-br from-card to-secondary/20 border-2 border-border/50 p-8 flex flex-col items-center justify-center transition-all duration-500 ease-in-out hover:shadow-2xl hover:border-primary hover:scale-105 h-full"
                  >
                    <Avatar className="w-28 h-28 mx-auto mb-4 rounded-full border-2 border-primary">
                      <AvatarImage src={teacher.photoURL || "/placeholder-user.jpg"} alt={teacher.displayName} />
                      <AvatarFallback>{teacher.displayName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <h4 className="font-bold text-xl mb-1">{teacher.displayName}</h4>
                    <p className="text-sm text-primary mb-3">{teacher.role}</p>
                    <p className="text-sm text-muted-foreground flex-grow">{teacher.bio || "Passionate about teaching and technology."}</p>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Join Us Section */}
        <section className="py-24">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Join Our Community</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
              Ready to start your learning journey? Browse our courses and become part of a growing community of
              learners and builders.
            </p>
            <Link href="/courses">
              <button className="bg-primary text-primary-foreground h-12 px-8 rounded-lg font-semibold text-lg hover:bg-primary/90 transition-colors">
                Browse Courses
              </button>
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}
