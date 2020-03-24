# How to generate Gaussian samples

Gaussian sampling - that is, generating samples from a Gaussian distribution - appears in many cutting-edge fields of data science, such as Gaussian process, variational autoencoders, and generative adversarial networks. 

As a result, you often see functions like [tf.random.normal](https://www.tensorflow.org/api_docs/python/tf/random/normal) in their tutorials. 

But, deep down, how does a computer know how to generate Gaussian samples? This series of blog posts will show 3 different ways that we can program our computer (via Python) to do so. You will also see how R and Python generate Gaussian samples using modified versions of some of these methods.

* Part 1: Generate Gaussian samples using inverse transform sampling: [code](notebook/part1.ipynb), write-up