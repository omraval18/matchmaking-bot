import { db } from "../src/lib/db/index.js";
import { users, bios } from "../src/lib/db/schema.js";

const testProfiles = [
  {
    "phone": "919800000001",
    "isAdmin": false,
    "biodata": {
      "firstName": "Rahul",
      "lastName": "Sharma",
      "gender": "Male",
      "age": 29,
      "dateOfBirth": "1996-02-14",
      "city": "Vadodara",
      "caste": "Brahmin",
      "currentCity": "Ahmedabad",
      "citizenship": "Indian",
      "education": "B.Tech IT",
      "occupation": "Backend Engineer",
      "company": "TCS",
      "height": "5'8\"",
      "diet": "Vegetarian",
      "extra": {},
      "url": ""
    }
  },
  {
    "phone": "919800000002",
    "isAdmin": false,
    "biodata": {
      "firstName": "Kunal",
      "lastName": "Patel",
      "gender": "Male",
      "age": 31,
      "dateOfBirth": "1993-07-19",
      "city": "Ahmedabad",
      "caste": "Patel",
      "currentCity": "Vadodara",
      "citizenship": "Indian",
      "education": "MBA",
      "occupation": "Product Manager",
      "company": "Flipkart",
      "height": "5'11\"",
      "diet": "Vegetarian",
      "extra": {},
      "url": ""
    }
  },
  {
    "phone": "919800000003",
    "isAdmin": false,
    "biodata": {
      "firstName": "Amit",
      "lastName": "Mehta",
      "gender": "Male",
      "age": 34,
      "dateOfBirth": "1991-10-03",
      "city": "Vadodara",
      "caste": "Jain",
      "currentCity": "Mumbai",
      "citizenship": "Indian",
      "education": "CA",
      "occupation": "Chartered Accountant",
      "company": "KPMG",
      "height": "5'6\"",
      "diet": "Jain",
      "extra": {},
      "url": ""
    }
  },
  {
    "phone": "919800000004",
    "isAdmin": false,
    "biodata": {
      "firstName": "Suresh",
      "lastName": "Desai",
      "gender": "Male",
      "age": 28,
      "dateOfBirth": "1997-04-21",
      "city": "Surat",
      "caste": "Desai",
      "currentCity": "Vadodara",
      "citizenship": "Indian",
      "education": "B.Com",
      "occupation": "Family Business",
      "company": "Desai Textiles",
      "height": "5'5\"",
      "diet": "Vegetarian",
      "extra": {},
      "url": ""
    }
  },
  {
    "phone": "919800000005",
    "isAdmin": false,
    "biodata": {
      "firstName": "Rakesh",
      "lastName": "Singh",
      "gender": "Male",
      "age": 33,
      "dateOfBirth": "1992-06-11",
      "city": "Delhi",
      "caste": "Rajput",
      "currentCity": "Gurgaon",
      "citizenship": "Indian",
      "education": "BBA",
      "occupation": "Operations Manager",
      "company": "Zomato",
      "height": "6'0\"",
      "diet": "Non-Vegetarian",
      "extra": {},
      "url": ""
    }
  },
  {
    "phone": "919800000006",
    "isAdmin": false,
    "biodata": {
      "firstName": "Pooja",
      "lastName": "Shah",
      "gender": "Female",
      "age": 26,
      "dateOfBirth": "1999-01-09",
      "city": "Vadodara",
      "caste": "Vaishnav",
      "currentCity": "Ahmedabad",
      "citizenship": "Indian",
      "education": "M.Com",
      "occupation": "Accounts Executive",
      "company": "Reliance",
      "height": "5'4\"",
      "diet": "Vegetarian",
      "extra": {},
      "url": ""
    }
  },
  {
    "phone": "919800000007",
    "isAdmin": false,
    "biodata": {
      "firstName": "Anjali",
      "lastName": "Patel",
      "gender": "Female",
      "age": 27,
      "dateOfBirth": "1998-08-17",
      "city": "Ahmedabad",
      "caste": "Patel",
      "currentCity": "Vadodara",
      "citizenship": "Indian",
      "education": "MBA HR",
      "occupation": "HR Manager",
      "company": "Adani",
      "height": "5'6\"",
      "diet": "Vegetarian",
      "extra": {},
      "url": ""
    }
  },
  {
    "phone": "919800000008",
    "isAdmin": false,
    "biodata": {
      "firstName": "Riya",
      "lastName": "Jain",
      "gender": "Female",
      "age": 25,
      "dateOfBirth": "2000-03-30",
      "city": "Vadodara",
      "caste": "Jain",
      "currentCity": "Mumbai",
      "citizenship": "Indian",
      "education": "BBA",
      "occupation": "Business Analyst",
      "company": "HSBC",
      "height": "5'5\"",
      "diet": "Jain",
      "extra": {},
      "url": ""
    }
  },
  {
    "phone": "919800000009",
    "isAdmin": false,
    "biodata": {
      "firstName": "Sneha",
      "lastName": "Iyer",
      "gender": "Female",
      "age": 30,
      "dateOfBirth": "1994-12-14",
      "city": "Chennai",
      "caste": "Iyer",
      "currentCity": "London",
      "citizenship": "UK",
      "education": "MS Finance",
      "occupation": "Financial Analyst",
      "company": "Goldman Sachs",
      "height": "5'6\"",
      "diet": "Vegetarian",
      "extra": {},
      "url": ""
    }
  },
  {
    "phone": "919800000010",
    "isAdmin": false,
    "biodata": {
      "firstName": "Neha",
      "lastName": "Gupta",
      "gender": "Female",
      "age": 29,
      "dateOfBirth": "1995-11-30",
      "city": "Delhi",
      "caste": "Agarwal",
      "currentCity": "Delhi",
      "citizenship": "Indian",
      "education": "M.Sc Biotechnology",
      "occupation": "Research Scientist",
      "company": "CSIR",
      "height": "5'4\"",
      "diet": "Vegetarian",
      "extra": {},
      "url": ""
    }
  },
  {
    "phone": "919800000011",
    "isAdmin": false,
    "biodata": {
      "firstName": "Aditya",
      "lastName": "Kumar",
      "gender": "Male",
      "age": 32,
      "dateOfBirth": "1993-06-22",
      "city": "Vadodara",
      "caste": "Brahmin",
      "currentCity": "San Francisco",
      "citizenship": "USA",
      "education": "MS Computer Science",
      "occupation": "Senior Software Engineer",
      "company": "Meta",
      "height": "5'9\"",
      "diet": "Vegetarian",
      "extra": {},
      "url": ""
    }
  },
  {
    "phone": "919800000012",
    "isAdmin": false,
    "biodata": {
      "firstName": "Kavya",
      "lastName": "Reddy",
      "gender": "Female",
      "age": 28,
      "dateOfBirth": "1996-04-18",
      "city": "Hyderabad",
      "caste": "Reddy",
      "currentCity": "Bangalore",
      "citizenship": "Indian",
      "education": "B.E Civil",
      "occupation": "Civil Engineer",
      "company": "L&T",
      "height": "5'7\"",
      "diet": "Non-Vegetarian",
      "extra": {},
      "url": ""
    }
  },
  {
    "phone": "919800000013",
    "isAdmin": false,
    "biodata": {
      "firstName": "Yash",
      "lastName": "Trivedi",
      "gender": "Male",
      "age": 27,
      "dateOfBirth": "1998-09-01",
      "city": "Vadodara",
      "caste": "Brahmin",
      "currentCity": "Pune",
      "citizenship": "Indian",
      "education": "M.Tech",
      "occupation": "ML Engineer",
      "company": "Infosys",
      "height": "5'10\"",
      "diet": "Vegetarian",
      "extra": {},
      "url": ""
    }
  },
  {
    "phone": "919800000014",
    "isAdmin": false,
    "biodata": {
      "firstName": "Aarti",
      "lastName": "Mehta",
      "gender": "Female",
      "age": 26,
      "dateOfBirth": "1999-06-12",
      "city": "Vadodara",
      "caste": "Vaishnav",
      "currentCity": "Surat",
      "citizenship": "Indian",
      "education": "B.Com",
      "occupation": "Operations Executive",
      "company": "HUL",
      "height": "5'5\"",
      "diet": "Vegetarian",
      "extra": {},
      "url": ""
    }
  },
  {
    "phone": "919800000015",
    "isAdmin": false,
    "biodata": {
      "firstName": "Nikhil",
      "lastName": "Joshi",
      "gender": "Male",
      "age": 35,
      "dateOfBirth": "1990-01-25",
      "city": "Vadodara",
      "caste": "Brahmin",
      "currentCity": "Indore",
      "citizenship": "Indian",
      "education": "PhD Physics",
      "occupation": "Professor",
      "company": "DAVV",
      "height": "5'6\"",
      "diet": "Vegetarian",
      "extra": {},
      "url": ""
    }
  }
];

async function seed() {
  console.log("Starting database seeding...");

  let successCount = 0;
  let errorCount = 0;

  for (const profile of testProfiles) {
    try {
      // Insert user first
      const [user] = await db
        .insert(users)
        .values({
          phone: profile.phone,
          isAdmin: profile.isAdmin,
        })
        .returning();

      console.log(`✓ Created user: ${profile.phone}`);

      // Insert biodata for the user
      await db.insert(bios).values({
        userId: user.id,
        firstName: profile.biodata.firstName,
        lastName: profile.biodata.lastName,
        gender: profile.biodata.gender,
        age: profile.biodata.age,
        dateOfBirth: profile.biodata.dateOfBirth,
        city: profile.biodata.city,
        caste: profile.biodata.caste,
        currentCity: profile.biodata.currentCity || null,
        citizenship: profile.biodata.citizenship,
        education: profile.biodata.education,
        occupation: profile.biodata.occupation,
        company: profile.biodata.company || null,
        height: profile.biodata.height,
        diet: profile.biodata.diet || null,
        extra: profile.biodata.extra,
        url: profile.biodata.url,
      });

      console.log(`✓ Created biodata for: ${profile.biodata.firstName} ${profile.biodata.lastName}`);
      successCount++;
    } catch (error) {
      console.error(`✗ Error inserting profile ${profile.phone}:`, error);
      errorCount++;
    }
  }

  console.log("\n=== Seeding Complete ===");
  console.log(`Successfully seeded: ${successCount} profiles`);
  console.log(`Errors: ${errorCount} profiles`);

  process.exit(0);
}

seed().catch((error) => {
  console.error("Fatal error during seeding:", error);
  process.exit(1);
});
